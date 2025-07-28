export const PluginErrorCodes = {
	InvalidPlugin: 'InvalidPlugin',
	PluginConflict: 'PluginConflict',
} as const;

export const ErrorCodes = {
	...PluginErrorCodes,
} as const;

export type PluginErrorCode = (typeof PluginErrorCodes)[keyof typeof PluginErrorCodes];
export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
