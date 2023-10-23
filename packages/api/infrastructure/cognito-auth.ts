import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { Auth } from '../application/auth';
import { Principal } from '../domain/dtos/principal';

export class CognitoAuth extends Auth {
    constructor() {
        super({
            USERNAME: 'cognito:username',
            ID: 'custom:userId',
            ROLE: 'custom:role',
        });
    }

    static extractPrincipal(event: APIGatewayProxyEventV2WithJWTAuthorizer): Principal {
        return {
            claims: event.requestContext.authorizer.jwt.claims,
        };
    }
}
