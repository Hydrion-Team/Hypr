export const version = '[VI]{{version}}[/VI]' as string;
import * as tslib from 'tslib';
export type * from './discord/index';
export type * from './selfbot/index';
try {
	require.resolve('discord.js');
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	tslib.__exportStar(require('./discord/index'), exports);
} catch {
}

try {
	require.resolve('discord.js-selfbot-v13');
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	tslib.__exportStar(require('./selfbot/index'), exports);
} catch {}

export * from './types/base';
export * from './libs/BaseClient';

export { HyprEvents } from './libs/GlobalEvents';

export { Plugin } from './structures/Plugin';
export { Plugins } from './managers/Plugins';

export * from './utils/logger/Logger';
export { default as Logger } from './utils/logger/Logger';
export * from './utils/logger/ILogger';

export { ErrorCodes, PluginErrorCodes } from './types/ErrorCodes';
export type { ErrorCode, PluginErrorCode } from './types/ErrorCodes';

export { Util } from './utils/util';
