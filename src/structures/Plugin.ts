import { z } from 'zod';
import type { RafeClient } from '../discord/libs/Client';
import { Plugins } from '../managers/Plugins';
import Logger from '../utils/logger/Logger';
import type { RafeSelfbot } from '../selfbot';
export interface PluginOptions {
  name: string;
  run: (client: RafeClient | RafeSelfbot) => any;
}
const validationSchema = z.object({
  name: z.string(),
  run: z.any().refine(val => typeof val === 'function', {
    message: 'run must be a function',
  }),
});

export class Plugin {
  public options: PluginOptions;

  public constructor(
    public name: PluginOptions['name'],
    public run: PluginOptions['run'],
  ) {
    try {
      this.options = validationSchema.parse({ name: this.name, run: this.run }) as PluginOptions;
    } catch (error) {
      Logger.warn(typeof error.code !== 'undefined' ? error.code : '', error.message);
      if (error.stack) Logger.trace(error.stack);
    }
    Plugins.register(this);
  }
}
