const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { getRepoUrl, getGitTags } = require('../utils/github');

const outputPath = path.resolve(__dirname, '../../CHANGELOG.md');

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
    release: '🚀 Release'
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
    const conventionalRegex = /^(\w+)(?:\(([^)]+)\))?: (.+)$/;
    const match = commit.subject.match(conventionalRegex);

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

    if (match) {
        const [, type, scope, description] = match;
        return {
            type,
            scope,
            description,
            hash: commit.hash,
            date: commit.date,
            author: authorInfo
        };
    }

    return {
        type: 'chore',
        scope: null,
        description: commit.subject,
        hash: commit.hash,
        date: commit.date,
        author: authorInfo
    };
}

function generateChangelog(lastCommit = null) {
    const repoUrl = getRepoUrl();
    const tags = getGitTags();
    const uniqueTags = [...new Set(tags)].filter(tag =>
        tag && tag !== 'lastest' && !tag.includes('undefined')
    );

    let changelog = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

`;
    if (uniqueTags.length > 0 || lastCommit) {
        const unreleasedCommits = getCommitsBetween(uniqueTags[0]);
        
        // lastCommit varsa onu da ekle
         if (unreleasedCommits.length > 0) {
            const unr = lastCommit ? unreleasedCommits.concat(lastCommit.split('\n')) : unreleasedCommits;
            const parsedCommits = unr.map(parseCommit);
            const groupedCommits = {};

            parsedCommits.forEach(commit => {
                const typeLabel = typeMap[commit.type] || '🔧 Chores';
                if (!groupedCommits[typeLabel]) {
                    groupedCommits[typeLabel] = [];
                }
                groupedCommits[typeLabel].push(commit);
            });

            changelog += `## Latest\n\n`;
            
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

        const parsedCommits = commits.map(parseCommit);
        const groupedCommits = {};

        parsedCommits.forEach(commit => {
            const typeLabel = typeMap[commit.type] || '🔧 Chores';
            if (!groupedCommits[typeLabel]) {
                groupedCommits[typeLabel] = [];
            }
            groupedCommits[typeLabel].push(commit);
        });

        const compareUrl = previousTag
            ? `${repoUrl}/compare/${previousTag}...${currentTag}`
            : `${repoUrl}/releases/tag/${currentTag}`;
        const versionDate = parsedCommits[0]?.date || new Date().toISOString().split('T')[0];
        changelog += `## [${currentTag}](${compareUrl}) - ${versionDate}\n\n`;

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

    return changelog.replace(/\n{3,}/g, '\n\n');
}
function generateLatestChangelogWithLinks() {
    const repoUrl = getRepoUrl();
    const tags = getGitTags();
    const uniqueTags = [...new Set(tags)].filter(tag =>
        tag && tag !== 'lastest' && !tag.includes('undefined')
    );

    if (uniqueTags.length === 0) return 'No tags found.';

    const latestTag = uniqueTags[0];
    const previousTag = uniqueTags[1];

    // 🔹 Son sürüm changelog'u
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

    const compareUrl = previousTag
        ? `${repoUrl}/compare/${previousTag}...${latestTag}`
        : `${repoUrl}/releases/tag/${latestTag}`;
    const versionDate = parsedCommits[0]?.date || new Date().toISOString().split('T')[0];

    let changelog = `## [${latestTag}](${compareUrl}) - ${versionDate}\n\n`;

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
    changelog += `---\n\n### Previous Versions\n\n`;

    for (let i = 1; i < uniqueTags.length - 1; i++) {
        const tagA = uniqueTags[i + 1];
        const tagB = uniqueTags[i];
        const url = `${repoUrl}/compare/${tagA}...${tagB}`;
        changelog += `- [${tagB}](${url})\n`;
    }

    return changelog.replace(/\n{3,}/g, '\n\n');
}

module.exports = generateChangelog;
exports.generateLatestChangelogWithLinks = generateLatestChangelogWithLinks;
if (require.main === module) {
    const commitMsgFile = process.argv[2];
    if (commitMsgFile) {
        const commitMsg = fs.readFileSync(commitMsgFile, 'utf-8');
        const types = Object.keys(typeMap).join('|');
        const regex = new RegExp(`^(${types})(\\(.+\\))?:\\s`);
        const lines = commitMsg.split('\n');

        const updatedLines = lines.map(line => {
            const typeMatch = line.match(regex);
            if (typeMatch) {
                const type = typeMatch[1];
                const emoji = typeMap[type]?.slice(0, 2) || ''; // 2 karakter slice çünkü bazı emojiler surrogate pair
                if (emoji && !line.startsWith(emoji)) {
                    return emoji + ' ' + line;
                }
            }
            return line;
        });

        const lastMsg = updatedLines.join('\n');
        fs.writeFileSync(commitMsgFile, lastMsg);
        console.log('✅ Commit message processed and updated with emoji!');
        console.log(`📝 Updated commit message: ${commitMsgFile}`);
        
        const changelogContent = generateChangelog(lastMsg);
        fs.writeFileSync(outputPath, changelogContent, 'utf8');
        console.log('✅ Changelog generated successfully!');
        console.log(`📝 Written to: ${outputPath}`);
    } else {
        const changelogContent = generateChangelog();
        fs.writeFileSync(outputPath, changelogContent, 'utf8');
        console.log('✅ Changelog generated successfully!');
        console.log(`📝 Written to: ${outputPath}`);
    }

}
