import type { BaseHyprOptions } from '../../types/base';
import type { ClientOptions as DiscordClientOptions, IntentsBitField } from 'discord.js';
import { Client as DiscordClient } from 'discord.js';
import Loader from '../../utils/loader';
import { Plugins } from '../../managers/Plugins';
import type { ClientEvents } from 'discord.js-selfbot-v13';
import type { EventListeners } from '../../libs/GlobalEvents';
/**
 * Options for the HyprClient.
 * @extends {DiscordClientOptions}
 */
export interface ClientOptions extends BaseHyprOptions, DiscordClientOptions {}
interface HyprEvents extends EventListeners, ClientEvents {}
export interface HyprClient<Ready extends boolean = boolean> extends DiscordClient<Ready> {
	emit<K extends keyof HyprEvents>(event: K, ...args: HyprEvents[K]): boolean;
	on<K extends keyof HyprEvents>(event: K, listener: (...args: HyprEvents[K]) => void): this;
	once<K extends keyof HyprEvents>(event: K, listener: (...args: HyprEvents[K]) => void): this;
	off<K extends keyof HyprEvents>(event: K, listener: (...args: HyprEvents[K]) => void): this;
	addListener<K extends keyof HyprEvents>(event: K, listener: (...args: HyprEvents[K]) => void): this;
	removeListener<K extends keyof HyprEvents>(event: K, listener: (...args: HyprEvents[K]) => void): this;
	removeAllListeners<K extends keyof HyprEvents>(event?: K): this;
	listenerCount<K extends keyof HyprEvents>(event: K): number;
	listeners<K extends keyof HyprEvents>(event: K): ((...args: HyprEvents[K]) => void)[];
	rawListeners<K extends keyof HyprEvents>(event: K): ((...args: HyprEvents[K]) => void)[];
	prependListener<K extends keyof HyprEvents>(event: K, listener: (...args: HyprEvents[K]) => void): this;
	prependOnceListener<K extends keyof HyprEvents>(event: K, listener: (...args: HyprEvents[K]) => void): this;
}
/**
 * The base {@link Client} that Hypr uses.
 *
 * @see {@link ClientOptions} for all available options for HyprClient.
 *
 * @extends {Client}
 */

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class HyprClient<Ready extends boolean = boolean> extends DiscordClient<Ready> implements HyprClient {
	declare public options: Omit<ClientOptions, 'intents'> & { intents: IntentsBitField };
	constructor(options: ClientOptions) {
		super({ ...options });
		if (options.loadDirectories) void Loader.registerDirectories(options.loadDirectories);
		setImmediate(() => {
			void (async () => {
				await Promise.all([Plugins.initiate(this)]);
			})();
		});
	}
}
