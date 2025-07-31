export const ErrorCodes = {} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
