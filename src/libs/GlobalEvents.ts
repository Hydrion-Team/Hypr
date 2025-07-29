import type { Plugin } from '../structures/Plugin';
export enum HyprEvents {
	PluginLoaded = 'PluginLoaded',
	PluginFailed = 'PluginFailed',
	PluginLoadFinished = 'PluginLoadFinished',
	PluginLoadStarted = 'PluginLoadStarted',
}

export interface EventListeners {
	PluginLoaded: [plugin: Plugin];
	PluginFailed: [plugin: Plugin, error: Error];
	PluginLoadFinished: [];
	PluginLoadStarted: [];
}
