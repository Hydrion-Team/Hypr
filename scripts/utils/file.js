const path = require("path");
const fs = require("fs");
exports.getPackageJson = () => {
    try {
    const packageJsonPath = path.resolve(__dirname, '../../package.json');
    if (!fs.existsSync(packageJsonPath)) {
        throw new Error('package.json not found');
    }
    return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
    } catch (error) {
        return {}
    }
}
exports.getTsconfig = () => {
    try {
    const packageJsonPath = path.resolve(__dirname, '../../tsconfig.json');
    if (!fs.existsSync(packageJsonPath)) {
        throw new Error('package.json not found');
    }
    return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
    } catch (error) {
        return {}
    }
}
