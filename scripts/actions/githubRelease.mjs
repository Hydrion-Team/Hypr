import { Octokit } from '@octokit/action';
import { getRepoInfo } from '../utils/github.mjs';
import { getPackageJson } from '../utils/file.mjs';
import path, { join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { typeMap, formatCommitLink } from './changelog.mjs';
const ok = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});
const info = getRepoInfo();
const { owner, repo } = info;
console.log('');
let packageJson;
let projectRoot;

function initializeConfig() {
  const __filename = fileURLToPath(import.meta.url);
  projectRoot = path.resolve(path.dirname(__filename), '..', '..');
  packageJson = getPackageJson();
}

async function checkTagExists(tagName) {
  console.log(tagName);
  try {
    const ref = await ok.rest.git.getRef({
      owner,
      repo,
      ref: `tags/${tagName}`,
    });
    console.log(ref.data);
    return true;
  } catch (error) {
    if (error.status === 404) {
      return false;
    }
    throw error;
  }
}

async function getCurrentCommitSha() {
  const { data: branch } = await ok.rest.repos.getBranch({
    owner,
    repo,
    branch: 'master',
  });
  return branch.commit.sha;
}

async function createVersionTag(version, sha) {
  console.log(`🏷️  Creating version tag: ${version}`);
  await ok.rest.git.createRef({
    owner,
    repo,
    ref: `refs/tags/${version}`,
    sha: sha,
  });
}

async function buildProject() {
  console.log('📦 Installing dependencies...');
  execSync('npm ci', { cwd: projectRoot, stdio: 'inherit' });

  console.log('🔨 Building TypeScript...');
  execSync('npm run build', { cwd: projectRoot, stdio: 'inherit', env: { ...process.env, BUILD_SOURCE: 'GH' } });

  console.log('📦 Running npm pack...');
  execSync('npm pack', { cwd: projectRoot, stdio: 'inherit' });

  // Rename .tgz file
  console.log('🔄 Renaming .tgz file...');
  const tgzFiles = execSync('ls *.tgz', { cwd: projectRoot, encoding: 'utf8' }).trim().split('\n');
  const originalTgzFile = tgzFiles[0];
  const newTgzFile = 'install.tgz';

  execSync(`mv "${originalTgzFile}" "${newTgzFile}"`, { cwd: projectRoot, stdio: 'inherit' });

  return join(projectRoot, newTgzFile);
}

async function createRelease(version, tgzPath, body = '') {
  console.log('🎉 Creating GitHub Release...');

  const { data: release } = await ok.rest.repos.createRelease({
    owner,
    repo,
    tag_name: version,
    name: version,
    body: body || `Release ${version}`,
    draft: false,
    prerelease: version.includes('alpha') || version.includes('beta') || version.includes('rc'),
  });

  // Upload the .tgz file as a release asset
  console.log('📎 Uploading release asset...');
  const tgzContent = readFileSync(tgzPath);

  await ok.rest.repos.uploadReleaseAsset({
    owner,
    repo,
    release_id: release.id,
    name: 'install.tgz',
    data: tgzContent,
  });

  return release;
}

export async function generateChangelog() {
  const { data: tags } = await ok.rest.repos.listTags({
    owner,
    repo,
    per_page: 2,
  });
  let changelog = '';
  if (tags.length === 0) return 'No tags found';

  const latestTag = tags[0];
  const { data: comparison } = await ok.rest.repos.compareCommitsWithBasehead({
    owner,
    repo,
    basehead: `${latestTag.name}...HEAD`,
  });

  const repoUrl = `https://github.com/${owner}/${repo}`;

  if (comparison.commits.length === 0) return 'No new commits since last tag';

  const parsedCommits = comparison.commits.flatMap(parseCommit);

  const groupedCommits = {};

  parsedCommits.forEach(commit => {
    const typeLabel = typeMap[commit.type] || '🔧 Chores';
    if (!groupedCommits[typeLabel]) {
      groupedCommits[typeLabel] = [];
    }
    groupedCommits[typeLabel].push(commit);
  });

  const typeOrder = Object.values(typeMap);

  typeOrder.forEach(typeLabel => {
    if (groupedCommits[typeLabel]) {
      changelog += `### ${typeLabel}\n\n`;
      groupedCommits[typeLabel].forEach(commit => {
        const commitLink = formatCommitLink(commit.hash, repoUrl);
        const scopeText = commit.scope ? `**${commit.scope}:**` : '';
        changelog += `- ${scopeText}${commit.description} ${commit.author} (${commitLink})\n`;
      });
      changelog += '\n';
    }
  });
  return changelog;
}
function parseCommit(commit) {
  const coAuthors = [];
  const fullMessage = `${commit.commit.message}\n${commit.commit.verification?.payload || ''}`;

  const coAuthorRegex = /Co-authored-by:\s*([^<]+)<([^>]+)>/g;
  let coAuthorMatch;
  while ((coAuthorMatch = coAuthorRegex.exec(fullMessage)) !== null) {
    const [, name, email] = coAuthorMatch;
    coAuthors.push({ name: name.trim(), email: email.trim() });
  }

  function formatAuthor(name, email) {
    const isBot = email?.includes('[bot]') || name?.includes('[bot]') || name?.includes('dependabot');
    if (isBot) {
      const cleanName = name.replace(/\[bot\]/g, '');
      return `[@${cleanName}[bot]](https://github.com/${cleanName})`;
    }

    let username = name;
    if (email?.includes('@users.noreply.github.com')) {
      username = email.split('@')[0].split('+').pop();
    }
    return `[@${username}](https://github.com/${username})`;
  }

  let authorInfo = '';
  const authorName = commit.author?.login || commit.commit.author.name;
  const authorEmail = commit.commit.author.email;

  if (authorName) {
    authorInfo = `by ${formatAuthor(authorName, authorEmail)}`;
    if (coAuthors.length > 0) {
      const coAuthorLinks = coAuthors.map(coAuthor => formatAuthor(coAuthor.name, coAuthor.email));
      authorInfo += `, ${coAuthorLinks.join(', ')}`;
    }
  }

  const subject = commit.commit.message.split('\n')[0];
  const conventionalRegex =
    /(?:[\p{Emoji_Presentation}\p{Extended_Pictographic}]+\s*)?(\w+)(?:\(([^)]+)\))?: ([^\p{Emoji_Presentation}\p{Extended_Pictographic}]+)/gu;
  const matches = [...subject.matchAll(conventionalRegex)];

  if (matches.length > 0) {
    return matches.map(match => {
      const [, type, scope, description] = match;
      return {
        type,
        scope,
        description: description.trim(),
        hash: commit.sha.substring(0, 7),
        date: commit.commit.author.date,
        author: authorInfo,
      };
    });
  }

  return [
    {
      type: 'chore',
      scope: null,
      description: subject,
      hash: commit.sha.substring(0, 7),
      date: commit.commit.author.date,
      author: authorInfo,
    },
  ];
}
/**
 * Main GitHub release generation function
 */
async function generateGitHubRelease() {
  try {
    console.log('🚀 Starting GitHub Release Process...');

    // Initialize configuration
    initializeConfig();
    console.log(`🔗 Repository: ${owner}/${repo} (from git remote)`);

    const version = `v${packageJson.version}`;
    console.log(`📋 Version: ${version}`);

    // Check if tag already exists
    console.log('🔍 Checking if tag exists...');
    const tagExists = await checkTagExists(version);

    if (tagExists) {
      console.log('⚠️  Tag already exists, skipping release creation');
      return;
    }

    console.log('✅ Tag does not exist, proceeding with release');

    // Get current commit SHA
    const currentSha = await getCurrentCommitSha();
    console.log(`📍 Current commit: ${currentSha.substring(0, 7)}`);

    const changelog = await generateChangelog();
    const notes = `## Release Notes\n\n${changelog}`;

    console.log(`📍Changelog:\n${changelog}`);

    // Create version tag
    await createVersionTag(version, currentSha);

    // Build project and create package
    const tgzPath = await buildProject();

    // Create GitHub release
    const release = await createRelease(version, tgzPath, notes);

    console.log('✅ GitHub Release created successfully!');
    console.log(`🔗 Release URL: ${release.html_url}`);
    console.log('📦 Asset uploaded: install.tgz');
  } catch (error) {
    console.error('❌ Release failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}
generateGitHubRelease();
