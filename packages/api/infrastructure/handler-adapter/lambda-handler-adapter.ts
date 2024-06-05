import { Logger } from '@aws-lambda-powertools/logger';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import middy, { MiddlewareObj } from '@middy/core';
import httpCors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import errorLogger from '@middy/error-logger';
import type {
    APIGatewayProxyEventV2WithRequestContext,
    APIGatewayProxyHandlerV2WithJWTAuthorizer,
    EventBridgeHandler,
    Handler,
    SNSHandler,
} from 'aws-lambda';

import { ApplicationEvent } from '../../domain/dtos/application-event';
import { z } from 'zod';
import { Errors } from '../../domain/dtos/errors';

export class LambdaHandlerAdapter {
    private static readonly isLocal = () => process.env.IS_LOCAL === 'true';

    private static readonly createLoggerCallback = (logger: Logger) => (error: unknown) => {
        let message = 'Unknown';
        let errorObject: Error | undefined;

        if (error instanceof Error) {
            message = error.message;
            errorObject = error;
        } else if (typeof error === 'string') {
            message = error;
            errorObject = new Error(error);
        }

        if (errorObject !== undefined) {
            logger.error(message, errorObject);
        } else {
            logger.error(message);
        }
    };

    private static readonly getHttpMiddlewares = (config: { logger: Logger }): MiddlewareObj[] => {
        const isLocal = LambdaHandlerAdapter.isLocal();

        return [
            httpCors(),
            injectLambdaContext(config.logger, { logEvent: !isLocal }),
            httpErrorHandler({ logger: LambdaHandlerAdapter.createLoggerCallback(config.logger) }),
        ];
    };

    private static readonly getEventBridgeMiddlewares = (config: {
        logger: Logger;
    }): MiddlewareObj[] => {
        const isLocal = LambdaHandlerAdapter.isLocal();

        return [
            injectLambdaContext(config.logger, { logEvent: !isLocal }),
            errorLogger({ logger: LambdaHandlerAdapter.createLoggerCallback(config.logger) }),
        ];
    };

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

    static adaptCustom = <T extends Handler>(handler: T, config: { logger: Logger }) =>
        LambdaHandlerAdapter.adapt(handler, LambdaHandlerAdapter.getEventBridgeMiddlewares(config));

    static adaptApplicationEvent = <T extends ApplicationEvent = ApplicationEvent>(
        handler: EventBridgeHandler<T['type'], T['detail'], void>,
        config: { logger: Logger },
    ) =>
        LambdaHandlerAdapter.adapt(handler, LambdaHandlerAdapter.getEventBridgeMiddlewares(config));

    static adaptAPIWithUserPoolAuthorizer = (
        handler: APIGatewayProxyHandlerV2WithJWTAuthorizer,
        config: { logger: Logger },
    ) => LambdaHandlerAdapter.adapt(handler, LambdaHandlerAdapter.getHttpMiddlewares(config));

    static adaptSNS = (handler: SNSHandler, config: { logger: Logger }) =>
        LambdaHandlerAdapter.adapt(handler, LambdaHandlerAdapter.getEventBridgeMiddlewares(config));

    /**
     * Helper function to parse an API Gateway request with type hinting and schema validation.
     * If some schema is not provided, the raw request will be returned, and if the validation fails,
     * an Validation Error will be thrown.
     *
     * `Be aware that query and path parameters are always strings.`
     */
    static readonly parseAPIRequest = <
        BST,
        BS extends z.ZodSchema<BST>,
        QST,
        QS extends z.ZodSchema<QST>,
        PST,
        PS extends z.ZodSchema<PST>,
    >(input: {
        event: APIGatewayProxyEventV2WithRequestContext<unknown>;
        bodySchema?: BS;
        querySchema?: QS;
        pathSchema?: PS;
    }): {
        body: z.infer<BS>;
        query: z.infer<QS>;
        path: z.infer<PS>;
    } => {
        const { event, bodySchema, querySchema, pathSchema } = input;

        const rawBody = event.body?.length ? (JSON.parse(event.body) as unknown) : {};
        const bodyValidation = bodySchema?.safeParse(rawBody);
        if (bodyValidation !== undefined && !bodyValidation.success) {
            throw Errors.validationError(bodyValidation.error);
        }

        const rawQuery = event.queryStringParameters ?? {};
        const queryValidation = querySchema?.safeParse(rawQuery);
        if (queryValidation !== undefined && !queryValidation.success) {
            throw Errors.validationError(queryValidation.error);
        }

        const rawPath = event.pathParameters ?? {};
        const pathValidation = pathSchema?.safeParse(rawPath);
        if (pathValidation !== undefined && !pathValidation.success) {
            throw Errors.validationError(pathValidation.error);
        }

        return {
            body: (bodyValidation?.data ?? rawBody) as z.infer<BS>,
            query: (queryValidation?.data ?? rawQuery) as z.infer<QS>,
            path: (pathValidation?.data ?? rawPath) as z.infer<PS>,
        };
    };
}
