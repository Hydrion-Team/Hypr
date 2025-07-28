import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath, pathToFileURL, URL } from 'url';
import { Util } from './util';

interface LoaderOptions {
	extensions: string[];
	pluginEntries: string[];
}

export default class Loader {
	/**
	 * The method that resolves the file for directoryLoader
	 * @param {any} file The file that will be resolved
	 * @param {string} fileType The file type
	 * @returns {any}
	 */
	private static resolveFile(file: any, fileType: string): any {
		if (fileType === '.ts' || fileType === '.mjs') {
			return file.default || Object.values(file as ArrayLike<unknown>)[0];
		}

		if (fileType === '.js' || fileType === '.cjs') {
			if (Util.isClass(file)) return file;
			if (file.default) return file.default;

			const values = Object.values(file as ArrayLike<unknown>);
			return values.length === 1 ? values[0] : file;
		}

		return file;
	}

	private static isFileURL(str: string): boolean {
		try {
			return new URL(str).protocol === 'file:';
		} catch {
			return false;
		}
	}
	private static readonly options: LoaderOptions = {
		extensions: ['.js', '.mjs', '.cjs', '.ts'],
		pluginEntries: [
			'index.js',
			'index.ts',
			'index.mjs',
			'index.cjs',
			'register.mjs',
			'register.cjs',
			'register.js',
			'register.ts',
			'dist/index.js',
			'dist/register.js',
			'dist/esm/index.js',
			'dist/cjs/register.js',
		],
	};

	static async registerDirectories(dirs: string[]): Promise<void> {
		await Promise.all(dirs.map(dir => this.directoryLoader(dir)));
	}

	static async registerDirectory(dir: string): Promise<any[]> {
		return this.directoryLoader(dir);
	}

	static async directoryLoader(dir: string): Promise<any[]> {
		if (!fs.existsSync(dir)) return [];

		const validExtensions = this.getValidExtensions();
		const entries = fs.readdirSync(dir, { withFileTypes: true });

		const loadPromises = entries.map(async entry => {
			const fullPath = path.join(dir, entry.name);

			if (entry.isDirectory()) {
				return this.directoryLoader(fullPath);
			}

			const ext = path.extname(entry.name);
			if (!validExtensions.includes(ext)) return [];

			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const module = await this.importModule(fullPath);
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return this.resolveFile(module, ext) ?? [];
		});

		const results = await Promise.all(loadPromises);
		return results.flat();
	}

	static async loadPluginFolder(basedir: string, folder: fs.Dirent): Promise<void> {
		if (!folder.isDirectory()) return;

		const validEntries = this.getValidPluginEntries();
		const folderPath = path.join(basedir, folder.name);

		for (const entry of validEntries) {
			const fullPath = path.join(folderPath, entry);
			if (fs.existsSync(fullPath)) {
				await this.importModule(fullPath);
				break;
			}
		}
	}

	static async pluginFinder(basedir: string): Promise<void> {
		if (this.isFileURL(basedir)) {
			basedir = fileURLToPath(basedir);
		}

		const pluginDirs = ['src/plugins', 'plugins']
			.map(dir => path.join(basedir, dir))
			.filter(dir => fs.existsSync(dir) && fs.statSync(dir).isDirectory());
		await Promise.all(pluginDirs.map(dir => this.loadPluginsFromDirectory(dir)));
	}

	private static async loadPluginsFromDirectory(dir: string): Promise<void> {
		const folders = fs.readdirSync(dir, { withFileTypes: true });
		await Promise.all(folders.map(folder => this.loadPluginFolder(dir, folder)));
	}

	private static async importModule(fullPath: string): Promise<any> {
		const ext = path.extname(fullPath);
		const isCommonJS = ext === '.cjs' || (!Util.isRunningWithEsm() && ext === '.js');
		const fileURL = isCommonJS ? fullPath : pathToFileURL(fullPath).href;
		return import(fileURL);
	}

	private static getValidExtensions(): string[] {
		return this.options.extensions.filter(ext => {
			if (ext === '.ts') return Util.isRunningWithTsx();
			if (ext === '.mjs') return Util.isRunningWithEsm();
			if (ext === '.cjs') return !Util.isRunningWithEsm();
			return true;
		});
	}

	private static getValidPluginEntries(): string[] {
		return this.options.pluginEntries.filter(entry => {
			if (entry.endsWith('.ts')) return Util.isRunningWithTsx();
			if (entry.endsWith('.mjs')) return Util.isRunningWithEsm();
			if (entry.endsWith('.cjs')) return !Util.isRunningWithEsm();
			return true;
		});
	}
}
