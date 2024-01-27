import createHttpError from 'http-errors';
import { ZodError } from 'zod';

export class Errors {
    static validationError = (error?: ZodError) =>
        new createHttpError.BadRequest(
            `Validation error: ${
                error?.errors.map((e) => `[${e.path.join(', ')}] ${e.message}`).join(', ') ?? ''
            }`,
        );

    static internalError = (message?: string) =>
        new createHttpError.InternalServerError(`Internal error: ${message ?? ''}`);

    static insufficientRole = (minimumRole: string) =>
        new createHttpError.Forbidden(
            `Insufficient role. The minimum required role is "${minimumRole}"`,
        );

    static unauthorizedPrincipal = (reason?: string) =>
        new createHttpError.Unauthorized(`Unauthorized principal${reason ? `: ${reason}` : ''}`);

    static resourceAccessDenied = (resource: string, resourceId: string) =>
        new createHttpError.Forbidden(
            `Access to resource "${resource}" denied (id: "${resourceId}")`,
        );

    static resourceNotFound = (resource: string, resourceId: string) =>
        new createHttpError.NotFound(`Resource "${resource}" not found (id: "${resourceId}")`);

    static businessRuleViolation = (message?: string) =>
        new createHttpError.BadRequest(`Business rule violation${message ? `: ${message}` : ''}`);
}
