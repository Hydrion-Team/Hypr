import { readFileSync, writeFileSync } from "fs";
import pkg from "../package.json"  with { type: 'json' };
import tsconfig from "../tsconfig.json"  with { type: 'json' };
import path from "path";
const outDir = path.join(process.cwd(), tsconfig.compilerOptions.outDir)
const read = readFileSync(path.join(outDir, "index.js"), "utf-8")
const regex = /\[VI\]\{\{(.+?)\}\}\[\/VI\]/g;
const write = read.replace(regex, (match, p1) => {
    if (p1 === "version") {
        return version();
    } else if (p1 === "name") { return pkg.name } else {
        return match;
    }
});
writeFileSync(path.join(outDir, "index.js"), write)
const extendRead = readFileSync(path.join(outDir, "extend.js"),"utf-8")
const extendWrite = extendRead.replace(regex, (match, p1) => {
    const url = pkg?.repository?.url.replace(/^git\+/, '').replace(/\.git$/, '') ?? '';
    const parts = url.split('/');
    const owner = parts[parts.length - 2];
    const repo = parts[parts.length - 1];
    if (p1 === "version") {
        return version();
    } else if (p1 === "name") { return pkg.name } else if (p1 == "ghown") { return owner } else if (p1 == "ghrep") { return repo } {
        return match;
    }
})
writeFileSync(path.join(outDir, "extend.js"), extendWrite)

function version() {
    try {
        return `v${pkg?.version}${process.argv.includes("--gh") ? "|GH" : ""}${process.argv.includes("--npm") ? "|NPM" : ""}` ?? 'v0.0.1';
    } catch {
        return 'v0.0.1';
    }
}
