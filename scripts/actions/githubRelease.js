const octokit = require("@octokit/action");
const { generateLatestChangelogWithLinks } = require("./changelog");
const { getRepoInfo } = require("../utils/github");


const ok = new octokit.Octokit({
    auth: process.env.GITHUB_TOKEN
});
const info = getRepoInfo();
const { owner, repo } = info;
const changelog = generateLatestChangelogWithLinks();
const notes = `## Release Notes\n\n${changelog}`;
console.log("");
console.log(`Changelog:\n${changelog}`);



async function checkTagExists(tagName) {
    try {
        await octokit.rest.git.getRef({
            owner,
            repo,
            ref: `tags/${tagName}`
        });
        return true;
    } catch (error) {
        if (error.status === 404) {
            return false;
        }
        throw error;
    }
}

async function getCurrentCommitSha() {
    const { data: currentCommit } = await octokit.rest.repos.getCommit({
        owner,
        repo,
        ref: 'main'
    });
    return currentCommit.sha;
}

async function handleOldLatestTag() {
    try {
        const { data: latestRef } = await octokit.rest.git.getRef({
            owner,
            repo,
            ref: 'tags/latest'
        });

        const oldLatestSha = latestRef.object.sha;

        // Find version tag that points to the same commit
        const { data: tags } = await octokit.rest.repos.listTags({
            owner,
            repo
        });

        const oldVersionTag = tags.find(tag =>
            tag.commit.sha === oldLatestSha &&
            /^v\d+\.\d+\.\d+/.test(tag.name)
        );

        const oldVersion = oldVersionTag ? oldVersionTag.name : 'v0.0.1';
        const oldTagName = `${oldVersion}`;

        console.log(`🏷️  Creating archive tag: ${oldTagName}`);

        await octokit.rest.git.createRef({
            owner,
            repo,
            ref: `refs/tags/${oldTagName}`,
            sha: oldLatestSha
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
    await octokit.rest.git.createRef({
        owner,
        repo,
        ref: `refs/tags/${version}`,
        sha: sha
    });
}
async function updateLatestTag(sha) {
    console.log('🏷️  Creating/updating latest tag');
    try {
        // Try to update existing latest tag
        await octokit.rest.git.updateRef({
            owner,
            repo,
            ref: 'tags/latest',
            sha: sha,
            force: true
        });
    } catch (error) {
        // If latest tag doesn't exist, create it
        await octokit.rest.git.createRef({
            owner,
            repo,
            ref: 'refs/tags/latest',
            sha: sha
        });
    }
}

async function buildProject() {
    console.log('📦 Installing dependencies...');
    execSync('npm ci', { cwd: projectRoot, stdio: 'inherit' });

    console.log('🔨 Building TypeScript...');
    execSync('npm run build', { cwd: projectRoot, stdio: 'inherit', env: { ...process.env, BUILD_SOURCE: "GH" } });

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
    body = notes

    const { data: release } = await octokit.rest.repos.createRelease({
        owner,
        repo,
        tag_name: version,
        name: version,
        body: body || `Release ${version}`,
        draft: false,
        prerelease: version.includes('alpha') || version.includes('beta') || version.includes('rc')
    });

    // Upload the .tgz file as a release asset
    console.log('📎 Uploading release asset...');
    const tgzContent = readFileSync(tgzPath);

    await octokit.rest.repos.uploadReleaseAsset({
        owner,
        repo,
        release_id: release.id,
        name: 'install.tgz',
        data: tgzContent
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

        // Update latest tag
        await updateLatestTag(currentSha);

        // Build project and create package
        const tgzPath = await buildProject();

        // Create GitHub release
        const release = await createRelease(version, tgzPath);

        console.log('✅ GitHub Release created successfully!');
        console.log(`🔗 Release URL: ${release.html_url}`);
        console.log(`📦 Asset uploaded: install.tgz`);

    } catch (error) {
        console.error('❌ Release failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        process.exit(1);
    }
}
generateGitHubRelease()