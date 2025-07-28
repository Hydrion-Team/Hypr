import type { BaseHyprOptions } from '../../types/base';
import type { ClientOptions as DiscordClientOptions } from 'discord.js';
/**
 * Options for the HyprClient.
 * @extends {ClientOptions}
 */
export interface ClientOptions extends DiscordClientOptions, BaseHyprOptions {}
