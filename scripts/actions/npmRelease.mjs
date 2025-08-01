import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPackageJson } from '../utils/file.mjs';

let packageJson;
let projectRoot;

function initializeConfig() {
  const __filename = fileURLToPath(import.meta.url);
  projectRoot = path.resolve(path.dirname(__filename), '..', '..');
  packageJson = getPackageJson();
}

function setupNpmAuth() {
  const npmToken = process.env.NPM_TOKEN;

  if (!npmToken) {
    throw new Error('NPM_TOKEN environment variable is not set');
  }

  execSync(`npm config set //registry.npmjs.org/:_authToken ${npmToken}`, { stdio: 'pipe' });
}

function checkVersionExists(packageName, version) {
  try {
    execSync(`npm view ${packageName}@${version}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function buildProject() {
  execSync('npm ci', { cwd: projectRoot, stdio: 'inherit' });
  execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' });
}

function publishPackage() {
  const publishCommand =
    packageJson.version.includes('alpha') || packageJson.version.includes('beta') || packageJson.version.includes('rc')
      ? 'npm publish --tag next'
      : 'npm publish';

  execSync(publishCommand, { cwd: projectRoot, stdio: 'inherit' });
}

async function publishToNpm() {
  try {
    initializeConfig();
    setupNpmAuth();

    const packageName = packageJson.name;
    const version = packageJson.version;

    if (checkVersionExists(packageName, version)) {
      console.log(`Version ${version} already exists on npm, skipping publish`);
      return;
    }

    buildProject();
    publishPackage();

    console.log(`Successfully published ${packageName}@${version} to npm`);
  } catch (error) {
    console.error('Publish failed:', error.message);
    process.exit(1);
  }
}

publishToNpm();
