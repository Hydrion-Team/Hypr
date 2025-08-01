import type { ClientOptions as DiscordClientOptions, IntentsBitField, ClientEvents } from 'discord.js';
import { Client as DiscordClient } from 'discord.js';
import Loader from '../../utils/loader';
import { Plugins } from '../../managers/Plugins';
import { RafeEvents as RafeEnum, type EventListeners } from '../../libs/GlobalEvents';
import { defaultOptions, type BaseClient, type BaseOptions } from '../../libs/BaseClient';
import { checkUpdate } from '../../utils/updater';
import { Container } from '../../libs/Container';
import type { RafeConfig } from '../../types/base';
export interface ClientOptions extends BaseOptions, DiscordClientOptions {}
interface RafeEvents extends Omit<EventListeners, keyof ClientEvents>, ClientEvents {}
export interface RafeClient<Ready extends boolean = boolean> extends DiscordClient<Ready> {
  emit<K extends keyof RafeEvents>(event: K, ...args: RafeEvents[K]): boolean;
  on<K extends keyof RafeEvents>(event: K, listener: (...args: RafeEvents[K]) => void): this;
  once<K extends keyof RafeEvents>(event: K, listener: (...args: RafeEvents[K]) => void): this;
  off<K extends keyof RafeEvents>(event: K, listener: (...args: RafeEvents[K]) => void): this;
  addListener<K extends keyof RafeEvents>(event: K, listener: (...args: RafeEvents[K]) => void): this;
  removeListener<K extends keyof RafeEvents>(event: K, listener: (...args: RafeEvents[K]) => void): this;
  removeAllListeners<K extends keyof RafeEvents>(event?: K): this;
  listenerCount<K extends keyof RafeEvents>(event: K): number;
  listeners<K extends keyof RafeEvents>(event: K): ((...args: RafeEvents[K]) => void)[];
  rawListeners<K extends keyof RafeEvents>(event: K): ((...args: RafeEvents[K]) => void)[];
  prependListener<K extends keyof RafeEvents>(event: K, listener: (...args: RafeEvents[K]) => void): this;
  prependOnceListener<K extends keyof RafeEvents>(event: K, listener: (...args: RafeEvents[K]) => void): this;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class RafeClient<Ready extends boolean = boolean> extends DiscordClient<Ready> implements BaseClient {
  declare public options: Omit<ClientOptions, 'intents'> & { intents: IntentsBitField };
  private data: RafeConfig = {
    pluginsLoaded: false,
  };
  constructor(options: ClientOptions) {
    super({ ...defaultOptions, ...options });
    if (this.options.checkUpdate) void checkUpdate();
    this.on(RafeEnum.PluginLoadFinished, () => {
      this.data.pluginsLoaded = true;
    });
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
  waitForPluginsLoad(): Promise<void> {
    return new Promise(resolve => {
      if (this.data.pluginsLoaded) {
        resolve();
        return;
      }
      this.once(RafeEnum.PluginLoadFinished, () => {
        resolve();
      });
    });
  }
  isSelfbotInstance(): this is import('../../selfbot/libs/Client').RafeSelfbot {
    return false;
  }
  isDiscordInstance(): this is RafeClient {
    return true;
  }
}
