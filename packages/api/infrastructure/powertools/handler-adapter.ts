import { Logger, injectLambdaContext } from '@aws-lambda-powertools/logger';
import middy from '@middy/core';
import httpCors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import { Handler } from 'aws-lambda';

export const handlerAdapter = <T extends Handler>(
    handler: T,
    config: {
        logger: Logger;
        isHttp: boolean;
    },
) => {
    const isLocal = process.env.IS_LOCAL === 'true';

    const middyHandler = middy(handler);
    if (config.isHttp === true) middyHandler.use(httpCors());
    middyHandler.use(injectLambdaContext(config.logger, { logEvent: !isLocal }));
    if (config.isHttp === true) {
        middyHandler.use(
            httpErrorHandler({
                logger: (error: Error) => config.logger.error(error.message, { error }),
            }),
        );
    }

    return middyHandler;
};
