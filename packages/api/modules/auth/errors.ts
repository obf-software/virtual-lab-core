import createHttpError from 'http-errors';

export const InvalidUserPoolJwtClaimsError = (message: string) =>
    new createHttpError.Forbidden(`Invalid user pool JWT claims: ${message}`);
