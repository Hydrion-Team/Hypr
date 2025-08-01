import { Octokit } from '@octokit/action';
import { generateLatestChangelogWithLinks } from './changelog.mjs';
import { getRepoInfo } from '../utils/github.mjs';
import { getPackageJson } from '../utils/file.mjs';
import path, { join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const ok = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});
const info = getRepoInfo();
const { owner, repo } = info;
const changelog = generateLatestChangelogWithLinks();
const notes = `## Release Notes\n\n${changelog}`;
console.log('');
console.log(`Changelog:\n${changelog}`);

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

async function handleOldLatestTag() {
  try {
    const { data: latestRef } = await ok.rest.git.getRef({
      owner,
      repo,
      ref: 'tags/latest',
    });

    const oldLatestSha = latestRef.object.sha;

    // Find version tag that points to the same commit
    const { data: tags } = await ok.rest.repos.listTags({
      owner,
      repo,
    });

    const oldVersionTag = tags.find(tag => tag.commit.sha === oldLatestSha && /^v\d+\.\d+\.\d+/.test(tag.name));

    const oldVersion = oldVersionTag ? oldVersionTag.name : 'v0.0.1';
    const oldTagName = `${oldVersion}`;

    console.log(`🏷️  Creating archive tag: ${oldTagName}`);

    await ok.rest.git.createRef({
      owner,
      repo,
      ref: `refs/tags/${oldTagName}`,
      sha: oldLatestSha,
    });
  } catch (error) {
    if (error.status !== 404) {
      console.warn('⚠️  Warning handling old latest tag:', error.message);
    } else {
      console.log('ℹ️  No previous latest tag found');
    }
  }
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

async function createRelease(version, tgzPath) {
  console.log('🎉 Creating GitHub Release...');

  // Read changelog if exists
  let body = '';
  body = notes;

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

    // Handle old latest tag
    await handleOldLatestTag();

    // Create version tag
    await createVersionTag(version, currentSha);

    // Build project and create package
    const tgzPath = await buildProject();

    // Create GitHub release
    const release = await createRelease(version, tgzPath);

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
