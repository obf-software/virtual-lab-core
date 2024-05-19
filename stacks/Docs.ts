import * as sst from 'sst/constructs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Api } from './Api';
import { OpenApiSpecs } from './OpenApiSpecs';
import { Core } from './Core';

export function Docs({ stack }: sst.StackContext) {
    const { ssmParameters } = sst.use(Core);
    const { pathsObjects } = sst.use(Api);

    const openApiSpecs = new OpenApiSpecs(stack, 'OpenApiSpecs', {
        info: {
            title: 'Virtual Lab API',
            version: '1.0.0',
        },
        servers: [
            {
                url: ssm.StringParameter.valueForStringParameter(stack, ssmParameters.apiUrl.name),
                description: `Virtual Lab API (${stack.stage})`,
            },
        ],
        tags: [
            {
                name: 'Instâncias',
                description: 'Rotas para manipulação de instâncias',
            },
            {
                name: 'Templates de instâncias',
                description: 'Rotas para manipulação de templates de instâncias',
            },
            {
                name: 'Usuários',
                description: 'Rotas para manipulação de usuários',
            },
            {
                name: 'Outros',
                description: 'Rotas para manipulação de outros recursos',
            },
        ],
        components: {
            parameters: {},
            schemas: {},
            securitySchemes: {
                UserPool: {
                    type: 'http',
                    description: 'Token de autenticação do usuário',
                    scheme: 'bearer',
                },
            },
            responses: {
                '400': {
                    description: 'Requisição inválida',
                    content: {
                        'text/plain': {
                            schema: {
                                anyOf: [
                                    {
                                        type: 'string',
                                        title: 'Validation error',
                                        description:
                                            'Returned when a validation against the request fails',
                                        example: 'Validation error: [path] message',
                                    },
                                    {
                                        type: 'string',
                                        title: 'Business rule violation',
                                        description: 'Returned when a business rule is violated',
                                        example: 'Business rule violation: [message]',
                                    },
                                    {
                                        type: 'string',
                                        title: 'Readable error',
                                        description:
                                            'Returned when the error will be shown to the user directly',
                                        example: '[message]',
                                    },
                                ],
                            },
                        },
                    },
                },
                '401': {
                    description: 'Acesso não autorizado',
                    content: {
                        'text/plain': {
                            schema: {
                                type: 'string',
                                title: 'Unauthorized principal',
                                description: 'Returned when the principal is not authorized',
                                example: 'Unauthorized principal: [reason]',
                            },
                        },
                    },
                },
                '403': {
                    description: 'Credenciais insuficientes ou acesso negado',
                    content: {
                        'text/plain': {
                            schema: {
                                anyOf: [
                                    {
                                        type: 'string',
                                        title: 'Insufficient role',
                                        description:
                                            'Returned when the principal has insufficient role to perform the action',
                                        example:
                                            'Insufficient role. The minimum required role is "[role]"',
                                    },
                                    {
                                        type: 'string',
                                        title: 'Resource access denied',
                                        description:
                                            'Returned when the principal does not have access to the resource',
                                        example: 'Access to resource denied: [resource] (id: [id])',
                                    },
                                ],
                            },
                        },
                    },
                },
                '404': {
                    description: 'Recurso não encontrado',
                    content: {
                        'text/plain': {
                            schema: {
                                type: 'string',
                                title: 'Resource not found',
                                description: 'Returned when the resource is not found',
                                example: 'Resource not found: [resource] (id: [id])',
                            },
                        },
                    },
                },
            },
        },
        paths: pathsObjects,
    });

    const docsSite = new sst.StaticSite(stack, 'DocsSite', {
        path: 'packages/docs',
        buildCommand: 'npm run build',
        buildOutput: 'build',
        environment: {
            API_DOCUMENTATION_SPEC_URL: openApiSpecs.getSpecsUrl(),
        },
    });

    stack.addOutputs({
        docsSiteUrl: docsSite.url,
        openApiSpecsUrl: openApiSpecs.getSpecsUrl(),
    });

    return {
        docsSite,
    };
}
