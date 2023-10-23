import createHttpError from 'http-errors';
import { Role } from '../dtos/role';

export class AuthError {
    static insufficientRole = (minimumRole: keyof typeof Role) =>
        new createHttpError.Forbidden(
            `Insufficient role. Minimum role required is "${minimumRole}"`,
        );
}
