import createHttpError from 'http-errors';
import { UserRole } from '../user/protocols';

export const InvalidUserPoolJwtClaimsError = (message: string) =>
    new createHttpError.Forbidden(`Invalid user pool JWT claims: ${message}`);

export const InsufficientRoleError = (
    minimumRole: keyof typeof UserRole,
    currentRole: keyof typeof UserRole,
) =>
    new createHttpError.Forbidden(
        `User role ${currentRole} is not sufficient. Minimum role required is ${minimumRole}.`,
    );
