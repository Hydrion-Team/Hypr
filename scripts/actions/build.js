const packageJson = require('../../package.json');
const tsconfigJson = require('../../tsconfig.json');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { getRepoUrl, getRepoInfo } = require('../utils/github');

const outDir = path.join(process.cwd(), tsconfigJson.compilerOptions.outDir);
const mainDir = path.join(__dirname, "..", "..");
const currentVersion = version();
const regex = /\[VI\]\{\{(.+?)\}\}\[\/VI\]/g;

console.log("🔧 -------------------");
console.log(`📦 Name: ${packageJson.name}`);
console.log(`🏷️  Current Version: ${packageJson.version}`);
console.log(`🌍 Source: ${process.env.BUILD_SOURCE ?? 'N/A'}`);
console.log(`📁 Main Directory: ${mainDir}`);
console.log(`📂 Output Directory: ${outDir}`);
console.log("🔧 -------------------");
console.log("");

console.log("🧹 Cleaning output directory...");
rmRecursive(outDir);
rmRecursive(path.join(mainDir, "tsconfig.tsbuildinfo"));
console.log("✨ -------------------");
console.log("");

console.log("🔨 Building TypeScript files...");
execSync(`tsc`, { stdio: 'inherit', cwd: mainDir });
console.log("✅ -------------------");
console.log("");

if (fs.existsSync(path.join(outDir, "index.js"))) {
    patchFile(path.join(outDir, "index.js"));
    console.log("🩹 Patched index.js...");
} else {
    console.log("⚠️  index.js not found, skipping patching.");
}

if (fs.existsSync(path.join(outDir, "extend.js"))) {
    patchFile(path.join(outDir, "extend.js"));
    console.log("🩹 Patched extend.js...");
} else {
    console.log("⚠️  extend.js not found, skipping patching.");
}

function patchFile(filePath) {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const patchedContent = fileContent.replace(regex, (match, p1) => {
        const info = getRepoInfo()
        if (p1 === "version") {
            return currentVersion;
        } else if (p1 === "name") {
            return packageJson.name;
        } else if (p1 == "ghown") { return info.owner } else if (p1 == "ghrep") { return info.repo } else {

            return match;
        }
    });
    fs.writeFileSync(filePath, patchedContent);
}

function rmRecursive(dir) {
    try {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`🗑️  Removed file: ${dir}`);
    } catch (error) {
        console.log(`ℹ️  ${dir} does not exist, skipping removal.`);
    }
}

function version() {
    try {
        const source = process.env.BUILD_SOURCE;
        return `v${packageJson?.version}${source ? `|${source}` : ""}` ?? 'v0.0.1';
    } catch {
        return 'v0.0.1';
    }
}