import createHttpError from 'http-errors';
import { schema } from '../repositories/protocols';

export const InvalidPrincipalError = (message: string) =>
    new createHttpError.Forbidden(`Invalid user pool JWT claims: ${message}`);

export const InsufficientRoleError = (
    minimumRole: (typeof schema.userRole.enumValues)[number],
    currentRole: (typeof schema.userRole.enumValues)[number],
) =>
    new createHttpError.Forbidden(
        `User role ${currentRole} is not sufficient. Minimum role required is ${minimumRole}.`,
    );
