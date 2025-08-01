import { execSync } from 'child_process';


function commitChangelogIfNeeded() {
    try {
        // Check if CHANGELOG.md has changes
        const status = execSync('git status --porcelain CHANGELOG.md', { encoding: 'utf8' }).trim();
        
        if (status) {
            console.log('📝 CHANGELOG.md has changes, committing...');
            execSync('git add CHANGELOG.md', { stdio: 'inherit' });
            execSync('git commit -m "docs: update CHANGELOG.md [skip ci]"', { stdio: 'inherit' });
            console.log('✅ CHANGELOG.md committed successfully!');
            return true;
        } else {
            console.log('ℹ️  No changes in CHANGELOG.md to commit');
            return false;
        }
    } catch (error) {
        console.error('❌ Error committing CHANGELOG.md:', error.message);
        return false;
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('🔍 Checking for CHANGELOG.md changes...');
    commitChangelogIfNeeded();
}