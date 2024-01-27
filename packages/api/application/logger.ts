export type LoggerExtraInput = [Error | string] | Record<string, unknown>[];

export interface Logger {
    debug: (message: string, ...args: LoggerExtraInput) => void;
    info: (message: string, ...args: LoggerExtraInput) => void;
    warn: (message: string, ...args: LoggerExtraInput) => void;
    error: (message: string, ...args: LoggerExtraInput) => void;
}
