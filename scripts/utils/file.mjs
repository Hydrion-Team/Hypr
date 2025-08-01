import { dirname, resolve } from "path";
import { existsSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export function getPackageJson() {
    try {
    const packageJsonPath = resolve(__dirname, '../../package.json');
    if (!existsSync(packageJsonPath)) {
        throw new Error('package.json not found');
    }
    return JSON.parse(readFileSync(packageJsonPath, 'utf8'));
        
    } catch (error) {
        return {}
    }
}
export function getTsconfig() {
    try {
    const packageJsonPath = resolve(__dirname, '../../tsconfig.json');
    if (!existsSync(packageJsonPath)) {
        throw new Error('package.json not found');
    }
    return JSON.parse(readFileSync(packageJsonPath, 'utf8'));
        
    } catch (error) {
        return {}
    }
}
