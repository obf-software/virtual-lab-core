import createHttpError from 'http-errors';

export const InvalidQueryParamsError = (message: string) =>
    new createHttpError.BadRequest(`Invalid query params: ${message}`);

export const InvalidPathParamsError = (message: string) =>
    new createHttpError.BadRequest(`Invalid path params: ${message}`);

export const InvalidBodyError = (message: string) =>
    new createHttpError.BadRequest(`Invalid body: ${message}`);
