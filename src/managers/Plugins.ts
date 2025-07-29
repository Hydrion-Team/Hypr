import { Collection } from '@discordjs/collection';
import { Plugin } from '../structures/Plugin';

import Logger from '../utils/logger/Logger';
import GlobalEvents, { HyprEvents } from '../libs/GlobalEvents';
import { PluginErrorCodes } from '../types/ErrorCodes';
import type { HyprClient } from '../discord/libs/Client';
import Loader from '../utils/loader';
import type { HyprSelfbot } from '../selfbot';
export class PluginManager extends Collection<string, Plugin> {
	public client: HyprClient | HyprSelfbot;
	public register(plugin: any): PluginManager {
		if (plugin instanceof Plugin) {
			if (this.has(plugin.name)) Logger.warn('Overwriting plugin', plugin.name);
			if (!plugin.options) {
				GlobalEvents.emit(HyprEvents.PluginRegisterError, PluginErrorCodes.InvalidPlugin);
				return this;
			}

			this.set(plugin.name, plugin);
			GlobalEvents.emit(HyprEvents.PluginRegistered, plugin);
		} else {
			GlobalEvents.emit(HyprEvents.PluginRegisterError, PluginErrorCodes.PluginConflict);
		}

		return this;
	}

	public async search(basedir: string): Promise<void> {
		await Loader.pluginFinder(basedir);
	}
	//TODO: hyprselfbot
	public async initiate(client: HyprClient | HyprSelfbot): Promise<void> {
		this.client = client;
		for (const plugin of this.values()) {
			await Promise.resolve(plugin.run(client))
				.catch(error => {
					GlobalEvents.emit(HyprEvents.PluginFailed, plugin, error as Error);
					Logger.error(typeof error.code !== 'undefined' ? error.code : '', error.message);
					if (error.stack) Logger.trace(error.stack);
				})
				.then(() => {
					GlobalEvents.emit(HyprEvents.PluginLoaded, plugin);
				});
		}
	}
}

export const Plugins = new PluginManager();
