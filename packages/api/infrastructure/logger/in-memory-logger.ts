import { Context } from 'aws-lambda';
import { Logger } from '../../application/logger';
import {
    LogItemMessage,
    LogItemExtraInput,
} from '@aws-lambda-powertools/logger/lib/cjs/types/Logger';

export class InMemoryLogger implements Logger {
    constructor(public storage: Record<string, unknown>[] = []) {}

    reset = (): void => {
        this.storage = [];
    };

    addContext = (context: Context): void => {
        this.storage.push({ context });
    };

    info = (input: LogItemMessage, ...extraInput: LogItemExtraInput): void => {
        this.storage.push({ level: 'info', input, extraInput });
    };

    warn = (input: LogItemMessage, ...extraInput: LogItemExtraInput): void => {
        this.storage.push({ level: 'warn', input, extraInput });
    };

    error = (input: LogItemMessage, ...extraInput: LogItemExtraInput): void => {
        this.storage.push({ level: 'error', input, extraInput });
    };

    debug = (input: LogItemMessage, ...extraInput: LogItemExtraInput): void => {
        this.storage.push({ level: 'debug', input, extraInput });
    };
}
