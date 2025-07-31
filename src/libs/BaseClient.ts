import type { Awaitable } from '../types/base';
import type { Container } from './Container';

/**
 * A valid prefix for GCommands.
 * * `string`: for single prefix, like `'?'`.
 * * `string[]`: an array of prefixes, like `['?', '!']`.
 * * `null`: disabled prefix, only mention works.
 */
export type MessagePrefix = string | string[] | null;

export interface BaseOptions {
	checkUpdate?: boolean;
	/*
	Load Message Commands
	*/
	loadMessageComands: boolean;
	/*
	Command prefix
	*/
	messagePrefix?:
		| ((message: import('discord.js').Message | import('discord.js-selfbot-v13').Message) => Awaitable<MessagePrefix>)
		| MessagePrefix;
	loadDirectories?: Array<string>;
	/**
	 * loadPlugins, it will search "plugins" folder
	 * Or you can use Plugins.search(__dirname)
	 * Or you can import with loadDirectories
	 */
	loadPlugins: boolean;
	baseDir?: string;
}

export interface BaseClient {
	container: Container<any>;
	waitForPluginsLoad(): Promise<void>;
	isSelfbotInstance(): this is import('../selfbot/libs/Client').RafeSelfbot;
	isDiscordInstance(): this is import('../discord/libs/Client').RafeClient;
}
export const defaultOptions = {
	baseDir: process.cwd() + '/src',
	checkUpdate: true,
} as BaseOptions;
