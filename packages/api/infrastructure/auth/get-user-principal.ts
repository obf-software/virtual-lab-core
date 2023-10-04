import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { Principal } from './protocols';
import { InvalidPrincipalError } from './errors';
import { schema } from '../repositories/protocols';

export const getRequestPrincipal = (event: APIGatewayProxyEventV2WithJWTAuthorizer): Principal => {
    const {
        'cognito:username': username,
        'custom:role': roleString,
        'custom:userId': userIdString,
    } = event.requestContext.authorizer.jwt.claims;

    if (typeof username !== 'string') {
        throw InvalidPrincipalError('Invalid "username"');
    }

    if (!userIdString) {
        throw InvalidPrincipalError('Invalid "userId"');
    }

    const userId = Number(userIdString.toString() ?? '');

    if (typeof userId !== 'number') {
        throw InvalidPrincipalError('Invalid "userId"');
    }

    let role: (typeof schema.userRole.enumValues)[number] = 'NONE';
    if (typeof roleString === 'string') {
        const allRoles: string[] = [...schema.userRole.enumValues.values()];
        role = allRoles.includes(roleString)
            ? (roleString as (typeof schema.userRole.enumValues)[number])
            : 'NONE';
    }

    return { username, role, userId };
};
