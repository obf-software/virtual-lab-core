import createHttpError from 'http-errors';

// export const UserNotFoundError = (key: string, value: string) =>
//     new createHttpError.NotFound(`User not found with ${key}: ${value}`);

export const InsufficientRoleError = (currentRole: string, minimumRole: string) =>
    new createHttpError.Forbidden(
        `User role ${currentRole} is not sufficient. Minimum role required is ${minimumRole}.`,
    );

export const InvalidQueryParamsError = (message: string) =>
    new createHttpError.BadRequest(`Invalid query params: ${message}`);
