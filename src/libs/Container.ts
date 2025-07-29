import type { HyprClient } from '../discord';
import type { HyprSelfbot } from '../selfbot';
import Logger from '../utils/logger/Logger';

export class Container<T extends HyprClient | HyprSelfbot> {
	constructor(public client: T) {}
	logger = Logger;
}
