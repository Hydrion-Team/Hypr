import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { getRepoUrl, getGitTags } from '../utils/github.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const outputPath = resolve(__dirname, '../../CHANGELOG.md');

const typeMap = {
  feat: '✨ Features',
  fix: '🐛 Bug Fixes',
  docs: '📚 Documentation',
  style: '💄 Styles',
  refactor: '♻️ Code Refactoring',
  test: '✅ Tests',
  chore: '🔧 Chores',
  ci: '⚙️ Continuous Integration',
  perf: '⚡ Performance Improvements',
  build: '🏗️ Build System',
  revert: '⏪ Reverts',
  lint: '🧹 Linting',
  pretty: '🎨 Code Formatting',
  config: '🛠️ Configuration',
  deps: '📦 Dependency Updates',
  release: '🚀 Release',
  wip: '🚧 Work In Progress',
};

function getCommitHash(fullHash) {
  return fullHash.substring(0, 7);
}

function formatCommitLink(hash, repoUrl) {
  const shortHash = getCommitHash(hash);
  return `[${shortHash}](${repoUrl}/commit/${hash})`;
}

function getCommitsBetween(from, to = 'HEAD') {
  try {
    const range = from ? `${from}..${to}` : to;
    const commits = execSync(`git log ${range} --pretty=format:"%H|%s|%ad|%an|%ae" --date=short`, { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(line => line)
      .map(line => {
        const parts = line.split('|');
        if (parts.length >= 5) {
          const [hash, subject, date, authorName, authorEmail] = parts;
          return { hash, subject, date, authorName, authorEmail };
        }
        return null;
      })
      .filter(commit => commit !== null);

    const commitsWithBodies = commits.map(commit => {
      try {
        const body = execSync(`git log -1 --pretty=format:"%B" ${commit.hash}`, { encoding: 'utf8' }).trim();
        return { ...commit, body };
      } catch {
        return { ...commit, body: '' };
      }
    });
    return commitsWithBodies;
  } catch {
    return [];
  }
}

function parseCommit(commit) {
  const coAuthors = [];
  if (commit.body) {
    const coAuthorRegex = /Co-authored-by:\s*([^<]+)<([^>]+)>/g;
    let coAuthorMatch;
    while ((coAuthorMatch = coAuthorRegex.exec(commit.body)) !== null) {
      const [, name, email] = coAuthorMatch;
      coAuthors.push({ name: name.trim(), email: email.trim() });
    }
  }

  function formatAuthor(name, email) {
    const isBot = email.includes('[bot]') || name.includes('[bot]') || name.includes('dependabot');
    if (isBot) {
      return `[@${name.replace(/\[bot\]/g, '')}[bot]](https://github.com/${name.replace(/\[bot\]/g, '')})`;
    } else {
      let username = name;
      if (email.includes('@users.noreply.github.com')) {
        username = email.split('@')[0];
      }
      return `[@${username}](https://github.com/${username})`;
    }
  }

  let authorInfo = '';
  if (commit.authorName && commit.authorEmail) {
    authorInfo = `by ${formatAuthor(commit.authorName, commit.authorEmail)}`;
    if (coAuthors.length > 0) {
      const coAuthorLinks = coAuthors.map(coAuthor => formatAuthor(coAuthor.name, coAuthor.email));
      authorInfo += `, ${coAuthorLinks.join(', ')}`;
    }
  }

  const conventionalRegex =
    /(?:[\p{Emoji_Presentation}\p{Extended_Pictographic}]+\s*)?(\w+)(?:\(([^)]+)\))?: ([\p{Emoji_Presentation}\p{Extended_Pictographic}]+)/gu;
  const matches = [...commit.subject.matchAll(conventionalRegex)];

  if (matches.length > 0) {
    // Return multiple parsed commits for each conventional commit found
    return matches.map(match => {
      const [, type, scope, description] = match;
      return {
        type: type.replace(/([\p{Emoji_Presentation}\p{Extended_Pictographic}])/g, ''),
        scope,
        description: description.trim(),
        hash: commit.hash,
        date: commit.date,
        author: authorInfo,
      };
    });
  }

  // Fallback for non-conventional commits
  return [
    {
      type: 'chore',
      scope: null,
      description: commit.subject,
      hash: commit.hash,
      date: commit.date,
      author: authorInfo,
    },
  ];
}

function generateChangelog(lastCommit = null) {
  const repoUrl = getRepoUrl();
  const tags = getGitTags();
  const lastCommitList = lastCommit
    ? lastCommit
        .split(/\r?\n/)
        .filter(line => !!line.trim())
        .map(line => ({
          hash: 'manual',
          subject: line.trim(),
          date: new Date().toISOString().split('T')[0],
          authorName: 'last-commit',
          authorEmail: 'last-commit@example.com',
          body: '',
        }))
    : [];
  const uniqueTags = [...new Set(tags)].filter(tag => tag && tag !== 'lastest' && !tag.includes('undefined'));

  let changelog = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

`;
  if (uniqueTags.length > 0 || lastCommit) {
    const unreleasedCommits = getCommitsBetween(uniqueTags[0]);
    if (unreleasedCommits.length > 0) {
      const unr = unreleasedCommits.concat(lastCommitList);
      const parsedCommits = unr.flatMap(parseCommit);
      const groupedCommits = {};

      parsedCommits.forEach(commit => {
        const typeLabel = typeMap[commit.type] || '🔧 Chores';
        if (!groupedCommits[typeLabel]) {
          groupedCommits[typeLabel] = [];
        }
        groupedCommits[typeLabel].push(commit);
      });

      changelog += '## Latest\n\n';

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
    }
  }

  for (let i = 0; i < uniqueTags.length; i++) {
    const currentTag = uniqueTags[i];
    const previousTag = uniqueTags[i + 1];
    const commits = getCommitsBetween(previousTag, currentTag);
    if (commits.length === 0) continue;

    const parsedCommits = commits.flatMap(parseCommit);
    const groupedCommits = {};

    parsedCommits.forEach(commit => {
      const typeLabel = typeMap[commit.type] || '🔧 Chores';
      if (!groupedCommits[typeLabel]) {
        groupedCommits[typeLabel] = [];
      }
      groupedCommits[typeLabel].push(commit);
    });

    const compareUrl = previousTag ? `${repoUrl}/compare/${previousTag}...${currentTag}` : `${repoUrl}/releases/tag/${currentTag}`;
    const versionDate = parsedCommits[0]?.date || new Date().toISOString().split('T')[0];
    changelog += `## [${currentTag}](${compareUrl}) - ${versionDate}\n\n`;

    const typeOrder = Object.values(typeMap);

    typeOrder.forEach(typeLabel => {
      if (groupedCommits[typeLabel]) {
        changelog += `### ${typeLabel}\n\n`;
        groupedCommits[typeLabel].forEach(commit => {
          const commitLink = formatCommitLink(commit.hash, repoUrl);
          const scopeText = commit.scope ? `**${commit.scope}:** ` : '';
          changelog += `- ${scopeText}${commit.description} ${commit.author} (${commitLink})\n`;
        });
        changelog += '\n';
      }
    });
  }

  return changelog.replace(/\n{3,}/g, '\n\n');
}

export default generateChangelog;
export function generateLatestChangelogWithLinks() {
  const repoUrl = getRepoUrl();
  const tags = getGitTags();
  const uniqueTags = [...new Set(tags)].filter(tag => tag && tag !== 'lastest' && !tag.includes('undefined'));
  let changelog = '';
  if (uniqueTags.length === 0) {
    const unreleasedCommits = getCommitsBetween(uniqueTags[0]);
    if (unreleasedCommits.length > 0) {
      const unr = unreleasedCommits;
      const parsedCommits = unr.flatMap(parseCommit);
      const groupedCommits = {};

      parsedCommits.forEach(commit => {
        const typeLabel = typeMap[commit.type] || '🔧 Chores';
        if (!groupedCommits[typeLabel]) {
          groupedCommits[typeLabel] = [];
        }
        groupedCommits[typeLabel].push(commit);
      });

      changelog += '## Latest\n\n';

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
    } else {
      return 'No tags found';
    }
  }
  const latestTag = uniqueTags[0];
  const previousTag = uniqueTags[1];

  const commits = getCommitsBetween(previousTag, latestTag);
  const parsedCommits = commits.map(parseCommit);
  const groupedCommits = {};

  parsedCommits.forEach(commit => {
    const typeLabel = typeMap[commit.type] || '🔧 Chores';
    if (!groupedCommits[typeLabel]) {
      groupedCommits[typeLabel] = [];
    }
    groupedCommits[typeLabel].push(commit);
  });

  const compareUrl = previousTag ? `${repoUrl}/compare/${previousTag}...${latestTag}` : `${repoUrl}/releases/tag/${latestTag}`;
  const versionDate = parsedCommits[0]?.date || new Date().toISOString().split('T')[0];

  changelog += `## [${latestTag}](${compareUrl}) - ${versionDate}\n\n`;

  const typeOrder = Object.values(typeMap);
  typeOrder.forEach(typeLabel => {
    if (groupedCommits[typeLabel]) {
      changelog += `### ${typeLabel}\n\n`;
      groupedCommits[typeLabel].forEach(commit => {
        const commitLink = formatCommitLink(commit.hash, repoUrl);
        const scopeText = commit.scope ? `**${commit.scope}:** ` : '';
        changelog += `- ${scopeText}${commit.description} ${commit.author} (${commitLink})\n`;
      });
      changelog += '\n';
    }
  });

  // 🔹 Önceki versiyonlar listesi
  changelog += '---\n\n### Previous Versions\n\n';

  for (let i = 1; i < uniqueTags.length - 1; i++) {
    const tagA = uniqueTags[i + 1];
    const tagB = uniqueTags[i];
    const url = `${repoUrl}/compare/${tagA}...${tagB}`;
    changelog += `- [${tagB}](${url})\n`;
  }

  return changelog.replace(/\n{3,}/g, '\n\n');
}

function amendCommitWithChangelog() {
  try {
    // Check if CHANGELOG.md has changes
    const status = execSync('git status --porcelain CHANGELOG.md', { encoding: 'utf8' }).trim();

    if (status) {
      console.log('📝 CHANGELOG.md has changes, amending to current commit...');
      execSync('git add CHANGELOG.md', { stdio: 'inherit' });
      // execSync('git commit --amend --no-edit', { stdio: 'inherit', env: { ...process.env, HUSKY_SKIP_AMEND: "1" } });
      console.log('✅ CHANGELOG.md added to current commit successfully!');
      return true;
    } else {
      console.log('ℹ️  No changes in CHANGELOG.md to amend');
      return false;
    }
  } catch (error) {
    console.error('❌ Error amending CHANGELOG.md:', error.message);
    return false;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const commitMsgFile = process.argv[2];

  if (commitMsgFile) {
    // Process commit message with emoji
    const commitMsg = readFileSync(commitMsgFile, 'utf-8');
    const types = Object.keys(typeMap).join('|');
    const regex = new RegExp(`^(${types})(\\(.+\\))?:\\s`);
    const lines = commitMsg.split(/\r?\n/);

    const updatedLines = lines.map(line => {
      const typeMatch = line.match(regex);
      if (typeMatch) {
        const type = typeMatch[1];
        const emoji = typeMap[type]?.slice(0, 2) || '';
        if (emoji && !line.startsWith(emoji)) {
          return emoji + ' ' + line;
        }
      }
      return line;
    });

    const lastMsg = updatedLines.join('\n');
    writeFileSync(commitMsgFile, lastMsg);
    console.log('✅ Commit message processed and updated with emoji!');
    console.log(`📝 Updated commit message: ${commitMsgFile}`);

    // Generate changelog but don't auto-commit during commit-msg hook
    // This prevents recursive commit issues
    //     const changelogContent = generateChangelog(lastMsg);
    //     writeFileSync(outputPath, changelogContent, 'utf8');
    //     console.log('✅ Changelog generated successfully!');
    //     console.log(`📝 Written to: ${outputPath}`);
  } else {
    // Manual changelog generation
    const changelogContent = generateChangelog();
    writeFileSync(outputPath, changelogContent, 'utf8');
    console.log('✅ Changelog generated successfully!');
    console.log(`📝 Written to: ${outputPath}`);
    amendCommitWithChangelog();
  }
}
