import { Logger, injectLambdaContext } from '@aws-lambda-powertools/logger';
import { Metrics } from '@aws-lambda-powertools/metrics';
import { Tracer, captureLambdaHandler } from '@aws-lambda-powertools/tracer';
import { PT_VERSION } from '@aws-lambda-powertools/commons/lib/version';
import { Handler } from 'aws-lambda';
import middy from '@middy/core';
import httpCors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';

const isLocal = process.env.IS_LOCAL === 'true';

const defaultValues = {
    region: process.env.AWS_REGION ?? 'N/A',
    executionEnv: process.env.AWS_EXECUTION_ENV ?? 'N/A',
};

export const logger = new Logger({
    persistentLogAttributes: !isLocal
        ? {
              ...defaultValues,
              logger: { name: '@aws-lambda-powertools/logger', version: PT_VERSION },
          }
        : undefined,
});
export const metrics = new Metrics({ defaultDimensions: defaultValues });
export const tracer = new Tracer();

export const createHandler = <T extends Handler>(handler: T, http = false) => {
    const middyHandler = middy(handler);
    // middyHandler.use(logMetrics(metrics, { throwOnEmptyMetrics: false }));
    if (http) middyHandler.use(httpCors());
    middyHandler.use(injectLambdaContext(logger, { logEvent: !isLocal }));
    middyHandler.use(captureLambdaHandler(tracer, { captureResponse: false }));
    if (http) {
        middyHandler.use(
            httpErrorHandler({ logger: (error: Error) => logger.error(error.message, { error }) }),
        );
    }

    return middyHandler;
};
