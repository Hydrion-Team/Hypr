export class Util {
  /**
   * Check if the input is a class
   * @param {any} input The input to check
   * @returns {boolean}
   */
  static isClass(input: any): boolean {
    return typeof input === 'function' && typeof input.prototype === 'object' && input.toString().substring(0, 5) === 'class';
  }

  static isRunningWithTsx(): boolean {
    const argv1 = process.argv[1] || '';
    return argv1.toLowerCase().includes('tsx');
  }
  static isRunningWithEsm(): boolean {
    try {
      return typeof require == 'undefined';
    } catch {
      return false;
    }
  }
}
