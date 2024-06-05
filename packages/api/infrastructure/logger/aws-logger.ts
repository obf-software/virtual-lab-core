import { Logger as PowerToolsLogger } from '@aws-lambda-powertools/logger';
import { Logger } from '../../application/logger';
import type {
    LogItemExtraInput,
    LogItemMessage,
} from '@aws-lambda-powertools/logger/lib/cjs/types/Logger';

export class AWSLogger extends PowerToolsLogger implements Logger {
    constructor() {
        super({ serviceName: 'api' });
    }

    /**
     * This method extension is necessary to log the error object in the console
     * when the environment is not local.
     *
     * This is necessary because the SST Console identifies the raw error object
     * and displays it in the ISSUES tab.
     */
    error(input: LogItemMessage, ...extraInput: LogItemExtraInput): void {
        const message = typeof input === 'string' ? input : input.message;
        let error = new Error(message);
        error.name = message;

        if (extraInput[0] instanceof Error) {
            [error] = extraInput;
        } else {
            const errors: Error[] = [];

            if (typeof extraInput[0] === 'object') {
                extraInput.forEach((extra) => {
                    Object.entries(extra).forEach(([key, value]) => {
                        if (key === 'error' && value instanceof Error) {
                            errors.push(value);
                        }
                    });
                });
            }

            if (errors.length > 0) {
                [error] = errors;
            }
        }

        super.error(input, ...extraInput);

        if (process.env.IS_LOCAL !== 'true') {
            console.error(error);
        }
    }
}
