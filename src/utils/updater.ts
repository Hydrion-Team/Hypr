import { blue, gray, red } from 'colorette';
import { version } from '..';
import { GH_OWNER, GH_REPO, name } from '../extend';

export async function checkUpdate(type: 'Client' | 'Selfbot' = 'Client'): Promise<void> {
	if (version == '[VI]{{version}}[/VI]') return;
	const [realVersion, from] = version.split('|');
	if (from == 'NPM') {
		try {
			const fetched = await fetch(`https://registry.npmjs.org/${name}`).then(x => x.json());
			const lastest = fetched['dist-tags'].latest == realVersion;
			if (!lastest) {
				const text =
					`\n${red('.')}` +
					`\n${red('|')}  You are not using lastest version. Lastest version is: ${fetched['tag_name']}` +
					`\n${red('|')}  To update, run "${blue(`npm i ${name}@${fetched['dist-tags'].latest}`)}"` +
					`\n${red('|')}  ${gray('You can disable this warning with')}` +
					`\n${red('|')}   ${gray(`new Rafe${type}({ checkUpdate: false })`)}` +
					`\n${red("'")}` +
					'\n';
				console.log(text);
			}
		} catch {}
	} else if (from == 'GH') {
		const fetched = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/releases/latest`).then(x =>
			x.json(),
		);
		const lastest = fetched['name'] == realVersion;
		if (!lastest && fetched?.['assets']?.[0]?.browser_download_url) {
			const text =
				`\n${red('.')}` +
				`\n${red('|')}  You are not using lastest version. Lastest version is: ${fetched['name']}` +
				`\n${red('|')}  To update, run "${blue(`npm i ${fetched?.['assets']?.[0]?.browser_download_url}`)}"` +
				`\n${red('|')}  ${gray('You can disable this warning with')}` +
				`\n${red('|')}   ${gray(`new Rafe${type}({ checkUpdate: false })`)}` +
				`\n${red("'")}` +
				'\n';
			console.log(text);
		}
	} else {
		const text =
			`\n${red('.')}` +
			`\n${red('|')}  You are using custom build` +
			`\n${red('|')}  ${gray('You can disable this warning with')}` +
			`\n${red('|')}   ${gray(`new Rafe${type}({ checkUpdate: false })`)}` +
			`\n${red("'")}` +
			'\n';
		console.log(text);
	}
}
