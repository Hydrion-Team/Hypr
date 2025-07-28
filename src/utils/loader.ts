import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { Util } from './util';

export default class Loader {
	static async registerDirectories(dirs: Array<string>) {
		for (const dir of dirs) {
			await this.directoryLoader(dir);
		}
	}
	static async registerDirectory(dir: string) {
		await this.directoryLoader(dir);
	}
	/**
	 * The method that loads all files from a directory
	 * @param {string} dir The directory to load
	 * @returns {Promise<any[]>}
	 */
	static async directoryLoader(dir: string): Promise<any[]> {
		const files: any[] = [];
		if (fs.existsSync(dir)) {
			for (const fsDirent of fs.readdirSync(dir, { withFileTypes: true })) {
				const rawFileName = fsDirent.name;
				const fileType = path.extname(rawFileName);

				if (fsDirent.isDirectory()) {
					const subFiles: any[] = await this.directoryLoader(path.join(dir, rawFileName));
					subFiles.forEach((file: any) => files.push(file));
					continue;
				} else if (!['.js', '.mjs', '.ts', '.json'].includes(fileType)) {
					continue;
				}

				const filePath = path.join(dir, rawFileName);
				const fileURL = pathToFileURL(filePath).href;
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const file = await import(fileURL);
				if (file) files.push(Util.resolveFile(file, fileType));
			}
		}

		return files;
	}

	/**
	 * The method that loads plugin files from a directory
	 * @param basedir The base plugin directory
	 * @param folder The plugin folder
	 */
	static async loadPluginFolder(basedir: string, folder: fs.Dirent) {
		if (folder.isDirectory()) {
			if (fs.existsSync(path.join(basedir, folder.name, 'register.js'))) {
				await import(path.join(basedir, folder.name, 'register.js'));
			} else if (fs.existsSync(path.join(basedir, folder.name, 'dist', 'index.js'))) {
				await import(path.join(basedir, folder.name, 'dist', 'index.js'));
			} else if (fs.existsSync(path.join(basedir, folder.name, 'dist', 'register.js'))) {
				await import(path.join(basedir, folder.name, 'dist', 'register.js'));
			}
		}
	}

	/**
	 * The method that find all plugins in a directory
	 * @param {string} basedir The directory to find plugins in
	 */
	static async pluginFinder(basedir: string) {
		if (fs.existsSync(basedir)) {
			if (fs.existsSync(path.join(basedir, 'src', 'plugins'))) {
				for (const folder of fs.readdirSync(path.join(basedir, 'src', 'plugins'), { withFileTypes: true })) {
					await this.loadPluginFolder(path.join(basedir, 'src', 'plugins'), folder);
				}
			}
		}
	}
}
