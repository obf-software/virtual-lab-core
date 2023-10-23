import createHttpError from 'http-errors';

export class CodingError {
    static unexpectedPrecondition = (message: string) =>
        new createHttpError.InternalServerError(`Unexpected precondition: ${message}`);
}
