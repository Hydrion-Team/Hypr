import type { Client } from 'discord.js-selfbot-v13';
import type { BaseHyprOptions } from '../../libs/BaseClient';
/**
 * Options for the HyprClient.
 * @extends {ClientOptions}
 */
export interface SelfbotOptions extends Client, BaseHyprOptions {}
