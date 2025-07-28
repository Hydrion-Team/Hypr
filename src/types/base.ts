type Awaitable<Value> = PromiseLike<Value> | Value;

/**
 * A valid prefix for GCommands.
 * * `string`: for single prefix, like `'?'`.
 * * `string[]`: an array of prefixes, like `['?', '!']`.
 * * `null`: disabled prefix, only mention works.
 */
export type HyprMessagePrefix = string | string[] | null;

export interface BaseHyprOptions {
	loadMessageComands: boolean;
	messagePrefix?:
		| ((
				message: import('discord.js').Message | import('discord.js-selfbot-v13').Message,
		  ) => Awaitable<HyprMessagePrefix>)
		| HyprMessagePrefix;
	loadDirectories?: Array<string>;
}
