export const version = '[VI]{{version}}[/VI]' as string;
// Selfbot Client
export * from './selfbot/index';
//Discord Client
export * from './discord/index';

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
