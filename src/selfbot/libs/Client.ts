import type { ClientOptions as DiscordClientOptions } from 'discord.js-selfbot-v13';
import { Client as DiscordClient } from 'discord.js-selfbot-v13';
import Loader from '../../utils/loader';
import { Plugins } from '../../managers/Plugins';
import type { ClientEvents } from 'discord.js-selfbot-v13';
import type { EventListeners } from '../../libs/GlobalEvents';
import { RafeEvents as RafeEnum } from '../../libs/GlobalEvents';
import { defaultOptions, type BaseClient, type BaseOptions } from '../../libs/BaseClient';
import { Container } from '../../libs/Container';
import type { RafeConfig } from '../../types/base';
export interface SelfbotOptions extends DiscordClientOptions, BaseOptions {}

interface SelfbotEvents extends Omit<EventListeners, keyof ClientEvents>, ClientEvents {}
export interface RafeSelfbot<Ready extends boolean = boolean> extends DiscordClient<Ready> {
  emit<K extends keyof SelfbotEvents>(event: K, ...args: SelfbotEvents[K]): boolean;
  on<K extends keyof SelfbotEvents>(event: K, listener: (...args: SelfbotEvents[K]) => void): this;
  once<K extends keyof SelfbotEvents>(event: K, listener: (...args: SelfbotEvents[K]) => void): this;
  off<K extends keyof SelfbotEvents>(event: K, listener: (...args: SelfbotEvents[K]) => void): this;
  addListener<K extends keyof SelfbotEvents>(event: K, listener: (...args: SelfbotEvents[K]) => void): this;
  removeListener<K extends keyof SelfbotEvents>(event: K, listener: (...args: SelfbotEvents[K]) => void): this;
  removeAllListeners<K extends keyof SelfbotEvents>(event?: K): this;
  listenerCount<K extends keyof SelfbotEvents>(event: K): number;
  listeners<K extends keyof SelfbotEvents>(event: K): ((...args: SelfbotEvents[K]) => void)[];
  rawListeners<K extends keyof SelfbotEvents>(event: K): ((...args: SelfbotEvents[K]) => void)[];
  prependListener<K extends keyof SelfbotEvents>(event: K, listener: (...args: SelfbotEvents[K]) => void): this;
  prependOnceListener<K extends keyof SelfbotEvents>(event: K, listener: (...args: SelfbotEvents[K]) => void): this;
}
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class RafeSelfbot<Ready extends boolean = boolean> extends DiscordClient<Ready> implements BaseClient {
  declare public options: SelfbotOptions;
  private data: RafeConfig = {
    pluginsLoaded: false,
  };
  constructor(options: SelfbotOptions) {
    super({ ...defaultOptions, ...options });

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
  isSelfbotInstance(): this is RafeSelfbot {
    return true;
  }
  isDiscordInstance(): this is import('../../discord/libs/Client').RafeClient {
    return true;
  }
}
