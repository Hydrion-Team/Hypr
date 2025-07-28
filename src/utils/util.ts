export class Util {
	/**
	 * Check if the input is a class
	 * @param {any} input The input to check
	 * @returns {boolean}
	 */
	static isClass(input: any): boolean {
		return (
			typeof input === 'function' && typeof input.prototype === 'object' && input.toString().substring(0, 5) === 'class'
		);
	}

	/**
	 * The method that resolves the file for directoryLoader
	 * @param {any} file The file that will be resolved
	 * @param {string} fileType The file type
	 * @returns {any}
	 */
	static resolveFile(file: any, fileType: string): any {
		if (fileType === '.ts') return file.default || Object.values(file as ArrayLike<unknown>)[0];
		if (fileType === '.js') {
			if (this.isClass(file)) return file;
			else return Object.values(file as ArrayLike<unknown>)[0];
		}

		return file;
	}
}
