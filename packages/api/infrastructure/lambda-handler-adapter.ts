import { Logger, injectLambdaContext } from '@aws-lambda-powertools/logger';
import middy, { MiddlewareObj } from '@middy/core';
import httpCors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import errorLogger from '@middy/error-logger';
import type {
    APIGatewayProxyHandlerV2WithJWTAuthorizer,
    EventBridgeHandler,
    Handler,
    SNSHandler,
} from 'aws-lambda';

import { ApplicationEvent } from '../domain/dtos/application-event';

export class LambdaHandlerAdapter {
    /**
     * Adapt a lambda handler to be used with middy. This is useful for adding
     * middlewares to the handler. The middlewares will be executed in the order
     * they are provided.
     */
    static adapt = <T extends Handler>(handler: T, middlewares: MiddlewareObj[]) => {
        const middyHandler = middy(handler);
        middlewares.forEach((middleware) => middyHandler.use(middleware));
        return middyHandler;
    };

    static adaptCustom = <T extends Handler>(handler: T, config: { logger: Logger }) => {
        const isLocal = process.env.IS_LOCAL === 'true';

        return LambdaHandlerAdapter.adapt(handler, [
            injectLambdaContext(config.logger, { logEvent: !isLocal }),
            errorLogger({
                logger: (error: unknown) =>
                    config.logger.error(error instanceof Error ? error.message : 'Unknown', {
                        error,
                    }),
            }),
        ]);
    };

    static adaptApplicationEvent = <T extends ApplicationEvent = ApplicationEvent>(
        handler: EventBridgeHandler<T['type'], T['detail'], void>,
        config: { logger: Logger },
    ) => {
        const isLocal = process.env.IS_LOCAL === 'true';

        return LambdaHandlerAdapter.adapt(handler, [
            injectLambdaContext(config.logger, { logEvent: !isLocal }),
            errorLogger({
                logger: (error: unknown) =>
                    config.logger.error(error instanceof Error ? error.message : 'Unknown', {
                        error,
                    }),
            }),
        ]);
    };

    static adaptAPIWithUserPoolAuthorizer = (
        handler: APIGatewayProxyHandlerV2WithJWTAuthorizer,
        config: { logger: Logger },
    ) => {
        const isLocal = process.env.IS_LOCAL === 'true';

        return LambdaHandlerAdapter.adapt(handler, [
            httpCors(),
            injectLambdaContext(config.logger, { logEvent: !isLocal }),
            httpErrorHandler({
                logger: (error: unknown) =>
                    config.logger.error(error instanceof Error ? error.message : 'Unknown', {
                        error,
                    }),
            }),
        ]);
    };

    static adaptSNS = (handler: SNSHandler, config: { logger: Logger }) => {
        const isLocal = process.env.IS_LOCAL === 'true';

        return LambdaHandlerAdapter.adapt(handler, [
            injectLambdaContext(config.logger, { logEvent: !isLocal }),
            errorLogger({
                logger: (error: unknown) =>
                    config.logger.error(error instanceof Error ? error.message : 'Unknown', {
                        error,
                    }),
            }),
        ]);
    };
}
