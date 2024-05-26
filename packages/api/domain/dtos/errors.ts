import createHttpError from 'http-errors';
import { ZodError } from 'zod';
import { Role } from './role';

export class Errors {
    static readonly validationError = (error?: ZodError) => {
        const reasonMessage =
            error?.errors.map((e) => `[${e.path.join(', ')}] ${e.message}`).join(', ') ?? '';
        return new createHttpError.BadRequest(`Validation error: ${reasonMessage}`);
    };

    static readonly internalError = (message?: string) => {
        const reasonMessage = message ?? '';
        return new createHttpError.InternalServerError(`Internal error: ${reasonMessage}`);
    };

    static readonly insufficientRole = (minimumRole?: Role) => {
        const reasonMessage = minimumRole ? `The minimum required role is "${minimumRole}"` : '';
        return new createHttpError.Forbidden(`Insufficient role: ${reasonMessage}`);
    };

    static readonly unauthorizedPrincipal = (reason?: string) => {
        const reasonMessage = reason ?? '';
        return new createHttpError.Unauthorized(`Unauthorized principal: ${reasonMessage}`);
    };

    static readonly resourceAccessDenied = (resource?: string, resourceId?: string) => {
        const reasonMessage = resource && resourceId ? `${resource} (id: ${resourceId})` : '';
        return new createHttpError.Forbidden(`Access to resource denied: ${reasonMessage}`);
    };

    static readonly resourceNotFound = (resource?: string, resourceId?: string) => {
        const reasonMessage = resource && resourceId ? `${resource} (id: ${resourceId})` : '';
        return new createHttpError.NotFound(`Resource not found: ${reasonMessage}`);
    };

    static readonly businessRuleViolation = (message?: string) => {
        const reasonMessage = message ?? '';
        return new createHttpError.BadRequest(`Business rule violation: ${reasonMessage}`);
    };
}
