import { z } from 'zod';
import type { HyprClient } from '../discord/libs/Client';
import { Plugins } from '../managers/Plugins';
import Logger from '../utils/logger/Logger';
//TODO: hyprselfbot
export interface PluginOptions {
	name: string;
	run: (client: HyprClient) => any;
}
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const validationSchema = z
	.object({
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		name: z.string(),
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		run: z.function(),
	})
	.loose();

export class Plugin {
	public options: PluginOptions;

	public constructor(
		public name: PluginOptions['name'],
		public run: PluginOptions['run'],
	) {
		validationSchema
			.parseAsync({ ...this })
			.then(options => {
				this.options = options as PluginOptions;

				Plugins.register(this);
			})
			.catch(error => {
				Logger.warn(typeof error.code !== 'undefined' ? error.code : '', error.message);
				if (error.stack) Logger.trace(error.stack);
			});
	}
}
