import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { UserPoolJwtClaims } from './protocols';
import { UserRole } from '../users/protocols';
import { InvalidUserPoolJwtClaimsError } from './errors';

export const getUserPoolJwtClaims = (
    event: APIGatewayProxyEventV2WithJWTAuthorizer,
): UserPoolJwtClaims => {
    const {
        'cognito:username': username,
        'custom:role': roleString,
        'custom:userId': userIdString,
    } = event.requestContext.authorizer.jwt.claims;

    if (typeof username !== 'string') {
        throw InvalidUserPoolJwtClaimsError('Invalid "username"');
    }

    if (!userIdString) {
        throw InvalidUserPoolJwtClaimsError('Invalid "userId"');
    }

    const userId = Number(userIdString.toString() ?? '');

    if (typeof userId !== 'number') {
        throw InvalidUserPoolJwtClaimsError('Invalid "userId"');
    }

    let role: keyof typeof UserRole = 'NONE';
    if (typeof roleString === 'string') {
        role = Object.keys(UserRole).includes(roleString)
            ? (roleString as keyof typeof UserRole)
            : 'NONE';
    }

    return { username, role, userId };
};

export const hasUserRoleOrAbove = (
    minimumRole: keyof typeof UserRole,
    role: keyof typeof UserRole,
): boolean => {
    const rolePrecedenceMap: Record<keyof typeof UserRole, number> = {
        NONE: 0,
        PENDING: 1,
        USER: 2,
        ADMIN: 3,
    };
    return rolePrecedenceMap[role] >= rolePrecedenceMap[minimumRole];
};
