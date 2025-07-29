import { blue, gray, red } from 'colorette';
import { version } from '..';
import { GH_OWNER, GH_REPO, name } from '../extend';

export async function checkUpdate() {
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
					`\n${red('|')}   ${gray('new HyprClient({ checkUpdate: false })')}` +
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
		if (!lastest) {
			const text =
				`\n${red('.')}` +
				`\n${red('|')}  You are not using lastest version. Lastest version is: ${fetched['name']}` +
				// eslint-disable-next-line max-len
				`\n${red('|')}  To update, run "${blue(`npm i https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/releases/latest`)}"` +
				`\n${red('|')}  ${gray('You can disable this warning with')}` +
				`\n${red('|')}   ${gray('new HyprClient({ checkUpdate: false })')}` +
				`\n${red("'")}` +
				'\n';
			console.log(text);
		}
	} else {
		const text =
			`\n${red('.')}` +
			`\n${red('|')}  You are using custom build` +
			`\n${red('|')}  ${gray('You can disable this warning with')}` +
			`\n${red('|')}   ${gray('new HyprClient({ checkUpdate: false })')}` +
			`\n${red("'")}` +
			'\n';
		console.log(text);
	}
}
