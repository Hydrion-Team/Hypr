const { execSync } = require("child_process");
const { getPackageJson } = require("./file");



exports.getRepoUrl = () => {
    let remoteUrl = process.env.GITHUB_REPOSITORY_URL;
    try {
        remoteUrl = execSync('git config --get remote.origin.url', { encoding: 'utf8' }).trim();

    } catch {
        const pkgJson = getPackageJson();
        remoteUrl = pkgJson?.repository?.url.replace(/^git\+/, '').replace(/\.git$/, '') ?? '';
    }
    return remoteUrl.replace(/\.git$/, '').replace(/^git@github\.com:/, 'https://github.com/');
}
exports.getRepoInfo = () => {
    const repoURL = exports.getRepoUrl();
    const gitMatch = repoURL.match(/github\.com[\/:]([^\/]+)\/([^\/]+)(?:\.git)?$/),

        owner = gitMatch[1],
        repo = gitMatch[2].replace('.git', '');
    return { owner, repo };
}
exports.getGitTags = () => {
    try {
        const tags = execSync('git tag --sort=-version:refname', { encoding: 'utf8' })
            .trim()
            .split('\n')
            .filter(tag => tag);
        return tags;
    } catch {
        return [];
    }
}
