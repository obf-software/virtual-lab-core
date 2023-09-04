import createHttpError from 'http-errors';

export const UserNotFoundError = (key: string, value: string) =>
    new createHttpError.NotFound(`User not found with ${key}: ${value}`);
