import { EventEmitter } from 'events';
import type { Plugin } from '../structures/Plugin';
import type { PluginErrorCode } from '../types/ErrorCodes';
export enum HyprEvents {
	PluginRegistered = 'PluginRegistered',
	PluginLoaded = 'PluginLoaded',
	PluginRegisterError = 'PluginRegisterError',
	PluginFailed = 'PluginFailed',
}

export interface EventListeners {
	PluginRegistered: [plugin: Plugin];
	PluginRegisterError: [error: PluginErrorCode];
	PluginLoaded: [plugin: Plugin];
	PluginFailed: [plugin: Plugin, error: Error];
}

export default new EventEmitter<EventListeners>();