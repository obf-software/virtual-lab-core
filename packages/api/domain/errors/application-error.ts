import createHttpError from 'http-errors';

export class ApplicationError {
    static invalidEntityData = (entity: string) =>
        new createHttpError.BadRequest(`Invalid ${entity} data`);

    static resourceNotFound = () => new createHttpError.NotFound(`Resource not found`);

    static businessRuleViolation = (message: string) =>
        new createHttpError.BadRequest(`Business rule violation: ${message}`);
}
