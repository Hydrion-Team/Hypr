import { EventEmitter } from 'events';
import type { Plugin } from '../structures/Plugin';
import type { PluginErrorCode } from '../types/ErrorCodes';
export enum HyprEvents {
	PluginRegistered = 'PluginRegistered',
	PluginLoaded = 'PluginLoaded',
	PluginRegisterError = 'PluginRegisterError',
	PluginFailed = 'PluginFailed',
	PluginLoadFinished = 'PluginLoadFinished'
}

export interface EventListeners {
	PluginRegistered: [plugin: Plugin];
	PluginRegisterError: [error: PluginErrorCode];
	PluginLoaded: [plugin: Plugin];
	PluginFailed: [plugin: Plugin, error: Error];
	PluginLoadFinished: [];
}

export default new EventEmitter<EventListeners>();
