#!/usr/bin/env node

import { Octokit } from '@octokit/action';
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Initialize Octokit with GitHub token
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

// Get repository information from Git remote or package.json
let owner, repo;

try {
  // First try to get from git remote
  const gitRemote = execSync('git remote get-url origin', {
    cwd: projectRoot,
    encoding: 'utf8'
  }).trim();
  
  const gitMatch = gitRemote.match(/github\.com[\/:]([^\/]+)\/([^\/]+)(?:\.git)?$/);
  if (gitMatch) {
    owner = gitMatch[1];
    repo = gitMatch[2].replace('.git', '');
  } else {
    throw new Error('Could not parse git remote URL');
  }
} catch (error) {
  // Fallback to package.json
  console.log('ℹ️  Could not get repo info from git remote, trying package.json...');
  const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));
  const repoUrl = packageJson.repository.url;
  const repoMatch = repoUrl.match(/github\.com[\/:]([^\/]+)\/([^\/]+)(?:\.git)?$/);
  
  if (repoMatch) {
    owner = repoMatch[1];
    repo = repoMatch[2].replace('.git', '');
  } else {
    throw new Error('Could not parse repository URL from package.json');
  }
}

// Get package.json for version info
const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));

async function main() {
  try {
    console.log('🚀 Starting GitHub Release Process...');

    // Get version from package.json
    const version = `v${packageJson.version}`;
    console.log(`📋 Version: ${version}`);

    // Check if tag already exists
    console.log('🔍 Checking if tag exists...');
    let tagExists = false;
    try {
      await octokit.rest.git.getRef({
        owner,
        repo,
        ref: `tags/${version}`
      });
      tagExists = true;
      console.log('⚠️  Tag already exists, skipping release creation');
      return;
    } catch (error) {
      if (error.status !== 404) {
        throw error;
      }
      console.log('✅ Tag does not exist, proceeding with release');
    }

    // Get current commit SHA
    const { data: currentCommit } = await octokit.rest.repos.getCommit({
      owner,
      repo,
      ref: 'main'
    });
    const currentSha = currentCommit.sha;

    // Handle old latest tag
    try {
      const { data: latestRef } = await octokit.rest.git.getRef({
        owner,
        repo,
        ref: 'tags/latest'
      });

      // Get the commit that the latest tag points to
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
      const oldTagName = `old-${oldVersion}`;

      console.log(`🏷️  Creating old tag: ${oldTagName}`);
      
      // Create old tag
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

    // Create version tag
    console.log(`🏷️  Creating version tag: ${version}`);
    await octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/tags/${version}`,
      sha: currentSha
    });

    // Create or update latest tag
    console.log('🏷️  Creating/updating latest tag');
    try {
      // Try to update existing latest tag
      await octokit.rest.git.updateRef({
        owner,
        repo,
        ref: 'tags/latest',
        sha: currentSha,
        force: true
      });
    } catch (error) {
      // If latest tag doesn't exist, create it
      await octokit.rest.git.createRef({
        owner,
        repo,
        ref: 'refs/tags/latest',
        sha: currentSha
      });
    }

    // Build the project
    console.log('📦 Installing dependencies...');
    execSync('npm ci', { cwd: projectRoot, stdio: 'inherit' });

    console.log('🔨 Building TypeScript...');
    execSync('npm run build -- --gh', { cwd: projectRoot, stdio: 'inherit' });

    console.log('📦 Running npm pack...');
    execSync('npm pack', { cwd: projectRoot, stdio: 'inherit' });

    // Rename .tgz file
    console.log('🔄 Renaming .tgz file...');
    const tgzFiles = execSync('ls *.tgz', { cwd: projectRoot, encoding: 'utf8' }).trim().split('\n');
    const originalTgzFile = tgzFiles[0];
    const newTgzFile = 'rafe-framework.tgz';
    
    execSync(`mv "${originalTgzFile}" "${newTgzFile}"`, { cwd: projectRoot, stdio: 'inherit' });

    // Read the .tgz file
    const tgzPath = join(projectRoot, newTgzFile);
    const tgzContent = readFileSync(tgzPath);

    // Create GitHub Release
    console.log('🎉 Creating GitHub Release...');
    const { data: release } = await octokit.rest.repos.createRelease({
      owner,
      repo,
      tag_name: version,
      name: version,
      draft: false,
      prerelease: false
    });

    // Upload the .tgz file as a release asset
    console.log('📎 Uploading release asset...');
    await octokit.rest.repos.uploadReleaseAsset({
      owner,
      repo,
      release_id: release.id,
      name: newTgzFile,
      data: tgzContent
    });

    console.log('✅ GitHub Release created successfully!');
    console.log(`🔗 Release URL: ${release.html_url}`);

  } catch (error) {
    console.error('❌ Release failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Check for required environment variables
if (!process.env.GITHUB_TOKEN) {
  console.error('❌ GITHUB_TOKEN environment variable is required');
  process.exit(1);
}

main();