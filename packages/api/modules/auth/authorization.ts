import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { UserPoolJwtClaims } from './protocols';
import { UserRole } from '../users/protocols';

export const getUserPoolJwtClaims = (
    event: APIGatewayProxyEventV2WithJWTAuthorizer,
): UserPoolJwtClaims => {
    const { 'cognito:username': username, 'custom:role': roleString } =
        event.requestContext.authorizer.jwt.claims;

    if (typeof username !== 'string') {
        throw new Error('Username is not a string');
    }

    let role: keyof typeof UserRole = 'NONE';
    if (typeof roleString === 'string') {
        role = Object.keys(UserRole).includes(roleString)
            ? (roleString as keyof typeof UserRole)
            : 'NONE';
    }

    return { username, role };
};

export const hasUserRoleOrAbove = (
    minimumRole: keyof typeof UserRole,
    role: keyof typeof UserRole,
): boolean => {
    const rolePrecedenceMap: Record<keyof typeof UserRole, number> = { NONE: 0, USER: 1, ADMIN: 2 };
    return rolePrecedenceMap[role] >= rolePrecedenceMap[minimumRole];
};
