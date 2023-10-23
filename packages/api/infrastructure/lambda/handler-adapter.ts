import { Logger, injectLambdaContext } from '@aws-lambda-powertools/logger';
import middy from '@middy/core';
import httpCors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import { Handler } from 'aws-lambda';

export class HandlerAdapter {
    private constructor(private readonly logger: Logger) {}

    static create = (logger: Logger) => new HandlerAdapter(logger);

    /**
     * Adapts aws http event handlers.
     */
    adaptHttp = <T extends Handler>(handler: T) => {
        const isLocal = process.env.IS_LOCAL === 'true';

        const middyHandler = middy(handler);
        middyHandler.use(httpCors());
        middyHandler.use(injectLambdaContext(this.logger, { logEvent: !isLocal }));
        middyHandler.use(
            httpErrorHandler({
                logger: (error: Error) => this.logger.error(error.message, { error }),
            }),
        );

        return middyHandler;
    };

    /**
     * Adapts aws event handlers.
     */
    adapt = <T extends Handler>(handler: T) => {
        const isLocal = process.env.IS_LOCAL === 'true';

        const middyHandler = middy(handler);
        middyHandler.use(injectLambdaContext(this.logger, { logEvent: !isLocal }));

        return middyHandler;
    };
}
