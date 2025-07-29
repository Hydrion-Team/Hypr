import { Collection } from '@discordjs/collection';
import { Plugin } from '../structures/Plugin';

import Logger from '../utils/logger/Logger';
import { HyprEvents } from '../libs/GlobalEvents';
import type { HyprClient } from '../discord/libs/Client';
import Loader from '../utils/loader';
import type { HyprSelfbot } from '../selfbot';
export class PluginManager extends Collection<string, Plugin> {
	public register(plugin: any): PluginManager {
		if (plugin instanceof Plugin) {
			if (this.has(plugin.name)) Logger.warn('Overwriting plugin', plugin.name);
			if (!plugin.options) {
				Logger.warn('Invalid plugin', plugin.name);
				return this;
			}

			this.set(plugin.name, plugin);
		} else {
			Logger.warn('Invalid plugin', plugin);
		}

		return this;
	}

	public async search(basedir: string): Promise<void> {
		await Loader.pluginFinder(basedir);
	}
	public async initiate(client: HyprClient | HyprSelfbot): Promise<void> {
		for (const plugin of this.values()) {
			await Promise.resolve(plugin.run(client))
				.catch(error => {
					(client as any).emit(HyprEvents.PluginFailed, plugin, error as Error);
					Logger.error(typeof error.code !== 'undefined' ? error.code : '', error.message);
					if (error.stack) Logger.trace(error.stack);
				})
				.then(() => {
					(client as any).emit(HyprEvents.PluginLoaded, plugin);
				});
		}
		(client as any).emit(HyprEvents.PluginLoadFinished);
	}
}

export const Plugins = new PluginManager();
