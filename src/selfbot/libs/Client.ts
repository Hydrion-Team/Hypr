import type { Client } from 'discord.js-selfbot-v13';
import type { BaseHyprOptions } from '../../types/base';
/**
 * Options for the HyprClient.
 * @extends {ClientOptions}
 */
export interface SelfbotOptions extends Client, BaseHyprOptions {}
