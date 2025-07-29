import type { ClientOptions as DiscordClientOptions } from 'discord.js-selfbot-v13';
import { Client as DiscordClient } from 'discord.js-selfbot-v13';
import Loader from '../../utils/loader';
import { Plugins } from '../../managers/Plugins';
import type { ClientEvents } from 'discord.js-selfbot-v13';
import type { EventListeners } from '../../libs/GlobalEvents';
import { defaultOptions, type BaseClient, type BaseHyprOptions } from '../../libs/BaseClient';
import GlobalEvents, { HyprEvents as HyprEnum } from '../../libs/GlobalEvents';
import { checkUpdate } from '../../utils/updater';
import { Container } from '../../libs/Container';
/**
 * Options for the HyprClient.
 * @extends {ClientOptions}
 */
export interface SelfbotOptions extends DiscordClientOptions, BaseHyprOptions {}

interface HyprEvents extends EventListeners, ClientEvents {}
export interface HyprSelfbot<Ready extends boolean = boolean> extends DiscordClient<Ready> {
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
export class HyprSelfbot<Ready extends boolean = boolean> extends DiscordClient<Ready> implements BaseClient {
	declare public options: SelfbotOptions;
	constructor(options: SelfbotOptions) {
		super({ ...defaultOptions, ...options });

		for (const eventName of Object.values(HyprEnum)) {
			GlobalEvents.on(eventName, (...args: unknown[]) => {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				return this.emit.call(this, eventName, ...args);
			});
		}
		if (this.options.checkUpdate) void checkUpdate();
		setImmediate(() => {
			void (async () => {
				if (this.options.loadPlugins) await Plugins.search(this.options.baseDir);
				if (this.options.loadDirectories) await Loader.registerDirectories(this.options.loadDirectories);

				await Plugins.initiate(this); //plugins first

				await Promise.all([]);
			})();
		});
	}
	container = new Container(this);
	isSelfbotInstance(): this is HyprSelfbot {
		return true;
	}
	isDiscordInstance(): this is import('../../discord/libs/Client').HyprClient {
		return true;
	}
}
