import * as sst from 'sst/constructs';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Api } from './Api';
import { OpenApiSpecs } from './OpenApiSpecs';
import { featureFlagIsEnabled } from './config/feature-flags';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Core } from './Core';

export function Docs({ stack, app }: sst.StackContext) {
    const { ssmParameters } = sst.use(Core);
    const { pathsObjects } = sst.use(Api);

    const openApiSpecs = new OpenApiSpecs(stack, 'OpenApiSpecs', {
        info: {
            title: 'API',
            version: '1.0.0',
            description: OpenApiSpecs.markdown`
                # Bem-vindo à API do Virtual Lab

                Esta API é responsável por fornecer acesso a recursos do Virtual Lab, um laboratório virtual de computação em nuvem.

                ## Categorias

                A API é dividida nas seguintes categorias, cada uma com suas respectivas rotas:

                ### Instâncias

                Rotas para manipulação das instâncias de máquinas virtuais.

                ### Templates de instâncias
                
                Rotas para manipulação dos templates de instâncias de máquinas virtuais. Templates são modelos de instâncias que podem ser utilizados para criar instâncias.

                ### Usuários
                
                Rotas para manipulação dos usuários do sistema.

                ### Outros
                
                Rotas para obtenção de informações adicionais sobre a API.

                ### Autenticação

                Todas as rotas são protegidas através de autenticação JWT. 
                
                Para obter um token, é necessário realizar login através do sistema de autenticação do AWS Cognito.
            `,
        },
        servers: [
            {
                url: StringParameter.valueForStringParameter(stack, ssmParameters.apiUrl.name),
                description: `${stack.stage}`,
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
            parameters: {
                InstanceIdPathParameter: {
                    in: 'path',
                    name: 'instanceId',
                    description: 'O id da instância',
                    required: true,
                    schema: {
                        $ref: '#/components/schemas/Id',
                    },
                },
                InstanceTemplateIdPathParameter: {
                    in: 'path',
                    name: 'instanceTemplateId',
                    description: 'O id do template de instância',
                    required: true,
                    schema: {
                        $ref: '#/components/schemas/Id',
                    },
                },
                UserIdPathParameter: {
                    in: 'path',
                    name: 'userId',
                    description: 'O id do usuário',
                    required: true,
                    schema: {
                        $ref: '#/components/schemas/Id',
                    },
                },
                PaginationOrderQueryParameter: {
                    in: 'query',
                    name: 'order',
                    description: 'A ordem dos resultados',
                    schema: {
                        type: 'string',
                        enum: ['asc', 'desc'],
                        default: 'asc',
                    },
                },
                TextSearchQueryParameter: {
                    in: 'query',
                    name: 'textSearch',
                    description: 'Texto utilizado para filtrar os resultados',
                    schema: {
                        type: 'string',
                    },
                },
            },
            schemas: {
                Id: {
                    type: 'string',
                    title: 'Id',
                    description: 'Um identificador hexadecimal único de 24 caracteres',
                    example: '000000000000000000000000',
                },
                SeekPaginated: {
                    type: 'object',
                    title: 'Resultados paginados',
                    description: 'Estrutura de dados para resultados paginados',
                    required: ['data', 'resultsPerPage', 'numberOfPages', 'numberOfResults'],
                    properties: {
                        data: {
                            type: 'array',
                        },
                        resultsPerPage: {
                            type: 'number',
                            title: 'Resultados por página',
                            example: 1,
                        },
                        numberOfPages: {
                            type: 'number',
                            title: 'Número total de páginas disponíveis',
                            example: 1,
                        },
                        numberOfResults: {
                            type: 'number',
                            title: 'Número total de resultados disponíveis',
                            example: 1,
                        },
                    },
                },
                InstanceConnectionType: {
                    type: 'string',
                    title: 'Tipo de conexão da instância',
                    enum: ['RDP', 'VNC'],
                },
                InstancePlatform: {
                    type: 'string',
                    title: 'Plataforma da instância',
                    enum: ['LINUX', 'WINDOWS', 'UNKNOWN'],
                },
                VirtualInstanceType: {
                    type: 'object',
                    title: 'Tipo de instância virtual',
                    required: [
                        'name',
                        'cpu',
                        'ram',
                        'gpu',
                        'hibernationSupport',
                        'networkPerformance',
                    ],
                    properties: {
                        name: {
                            type: 'string',
                            title: 'Nome do tipo de instância',
                            example: 't2.micro',
                        },
                        cpu: {
                            type: 'object',
                            title: 'Informações do CPU da instância',
                            required: [
                                'cores',
                                'threadsPerCore',
                                'vCpus',
                                'manufacturer',
                                'clockSpeedInGhz',
                            ],
                            properties: {
                                cores: {
                                    type: 'number',
                                    title: 'Número de núcleos',
                                    example: 1,
                                },
                                threadsPerCore: {
                                    type: 'number',
                                    title: 'Número de threads por núcleo',
                                    example: 1,
                                },
                                vCpus: {
                                    type: 'number',
                                    title: 'Número de vCPUs',
                                    example: 1,
                                },
                                manufacturer: {
                                    type: 'string',
                                    title: 'Fabricante',
                                    example: 'Intel',
                                },
                                clockSpeedInGhz: {
                                    type: 'number',
                                    title: 'Velocidade do clock em GHz',
                                    example: 2.5,
                                },
                            },
                        },
                        ram: {
                            type: 'object',
                            title: 'Informações da memória RAM da instância',
                            required: ['sizeInMb'],
                            properties: {
                                sizeInMb: {
                                    type: 'number',
                                    title: 'Tamanho em MB',
                                    example: 1024,
                                },
                            },
                        },
                        gpu: {
                            type: 'object',
                            title: 'Informações dos dispositivos de GPU da instância',
                            required: ['totalGpuMemoryInMb', 'devices'],
                            properties: {
                                totalGpuMemoryInMb: {
                                    type: 'number',
                                    title: 'Memória total da GPU em MB',
                                    example: 1024,
                                },
                                devices: {
                                    type: 'array',
                                    title: 'Dispositivos de GPU',
                                    items: {
                                        type: 'object',
                                        title: 'Dispositivo de GPU',
                                        required: ['count', 'name', 'manufacturer', 'memoryInMb'],
                                        properties: {
                                            count: {
                                                type: 'number',
                                                title: 'Número de dispositivos',
                                                example: 1,
                                            },
                                            name: {
                                                type: 'string',
                                                title: 'Nome do dispositivo',
                                                example: 'Tesla T4',
                                            },
                                            manufacturer: {
                                                type: 'string',
                                                title: 'Fabricante',
                                                example: 'NVIDIA',
                                            },
                                            memoryInMb: {
                                                type: 'number',
                                                title: 'Memória em MB',
                                                example: 1024,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        hibernationSupport: {
                            type: 'boolean',
                            title: 'Suporte a hibernação',
                            description: 'Indica se a instância suporta hibernação',
                        },
                        networkPerformance: {
                            type: 'string',
                            title: 'Performance de rede',
                            description: 'A performance de rede da instância',
                        },
                    },
                },
                InstanceState: {
                    type: 'string',
                    title: 'Estado da instância',
                    enum: [
                        'PENDING',
                        'RUNNING',
                        'STOPPING',
                        'STOPPED',
                        'SHUTTING_DOWN',
                        'TERMINATED',
                    ],
                },
                Instance: {
                    type: 'object',
                    title: 'Instância',
                    description: 'Uma instância de máquina virtual',
                    required: [
                        'id',
                        'productId',
                        'machineImageId',
                        'ownerId',
                        'launchToken',
                        'name',
                        'description',
                        'canHibernate',
                        'platform',
                        'distribution',
                        'instanceType',
                        'storageInGb',
                        'createdAt',
                        'updatedAt',
                    ],
                    properties: {
                        id: {
                            type: 'string',
                            title: 'Id da instância',
                            $ref: '#/components/schemas/Id',
                        },
                        virtualId: {
                            type: 'string',
                            title: 'Id da instância virtual',
                        },
                        productId: {
                            type: 'string',
                            title: 'Id do produto do AWS Service Catalog utilizado para criar a instância',
                        },
                        machineImageId: {
                            type: 'string',
                            title: 'Id da imagem da máquina virtual utilizada para criar a instância',
                        },
                        ownerId: {
                            type: 'string',
                            title: 'Id do usuário proprietário da instância',
                            $ref: '#/components/schemas/Id',
                        },
                        launchToken: {
                            type: 'string',
                            title: 'Token de criação da instância',
                            description:
                                'No momento da criação da instância, um token de idenpotência é gerado para garantir que a instância seja criada apenas uma vez',
                        },
                        name: {
                            type: 'string',
                            title: 'Nome da instância',
                        },
                        description: {
                            type: 'string',
                            title: 'Descrição da instância',
                        },
                        connectionType: {
                            type: 'string',
                            title: 'Tipo de conexão da instância',
                            $ref: '#/components/schemas/InstanceConnectionType',
                        },
                        canHibernate: {
                            type: 'boolean',
                            title: 'Capacidade de hibernação da instância',
                            description: 'Indica se a instância pode ser hibernada',
                        },
                        platform: {
                            type: 'string',
                            title: 'Plataforma da instância',
                            $ref: '#/components/schemas/InstancePlatform',
                        },
                        distribution: {
                            type: 'string',
                            title: 'Distribuição da instância',
                        },
                        instanceType: {
                            type: 'object',
                            title: 'Tipo de instância virtual',
                            $ref: '#/components/schemas/VirtualInstanceType',
                        },
                        storageInGb: {
                            type: 'string',
                            title: 'Armazenamento em GB',
                        },
                        createdAt: {
                            type: 'string',
                            title: 'Data de criação',
                            format: 'date-time',
                        },
                        updatedAt: {
                            type: 'string',
                            title: 'Data da última atualização',
                            format: 'date-time',
                        },
                        lastConnectionAt: {
                            type: 'string',
                            title: 'Data da última conexão',
                            format: 'date-time',
                        },
                        state: {
                            type: 'string',
                            title: 'Estado da instância',
                            $ref: '#/components/schemas/InstanceState',
                        },
                    },
                },
                InstanceTemplate: {
                    type: 'object',
                    title: 'Template de instância',
                    description: 'Um template de instância de máquina virtual',
                    required: [
                        'id',
                        'createdBy',
                        'name',
                        'description',
                        'productId',
                        'machineImageId',
                        'platform',
                        'distribution',
                        'storageInGb',
                        'createdAt',
                        'updatedAt',
                    ],
                    properties: {
                        id: {
                            type: 'string',
                            title: 'Id do template de instância',
                            $ref: '#/components/schemas/Id',
                        },
                        createdBy: {
                            type: 'string',
                            title: 'Id do usuário que criou o template',
                            $ref: '#/components/schemas/Id',
                        },
                        name: {
                            type: 'string',
                            title: 'Nome do template',
                        },
                        description: {
                            type: 'string',
                            title: 'Descrição do template',
                        },
                        productId: {
                            type: 'string',
                            title: 'Id do produto do AWS Service Catalog atribuído ao template',
                        },
                        machineImageId: {
                            type: 'string',
                            title: 'Id da imagem da máquina virtual atribuída ao template',
                        },
                        platform: {
                            type: 'string',
                            title: 'Plataforma do template',
                            $ref: '#/components/schemas/InstancePlatform',
                        },
                        distribution: {
                            type: 'string',
                            title: 'Distribuição do template',
                        },
                        storageInGb: {
                            type: 'number',
                            title: 'Armazenamento em GB',
                        },
                        createdAt: {
                            type: 'string',
                            title: 'Data de criação',
                            format: 'date-time',
                        },
                        updatedAt: {
                            type: 'string',
                            title: 'Data da última atualização',
                            format: 'date-time',
                        },
                    },
                },
                Role: {
                    type: 'string',
                    title: 'Cargo do usuário',
                    description: 'O cargo do usuário no sistema',
                    enum: ['NONE', 'PENDING', 'USER', 'ADMIN'],
                },
                User: {
                    type: 'object',
                    title: 'Usuário',
                    description: 'Um usuário do sistema',
                    required: ['id', 'username', 'role', 'createdAt', 'updatedAt', 'quotas'],
                    properties: {
                        id: {
                            type: 'string',
                            title: 'Id do usuário',
                            $ref: '#/components/schemas/Id',
                        },
                        username: {
                            type: 'string',
                            title: 'Identificador que liga o usuário do banco de dados ao usuário do AWS Cognito',
                        },
                        name: {
                            type: 'string',
                            title: 'Nome do usuário',
                        },
                        preferredUsername: {
                            type: 'string',
                            title: 'Nome de usuário preferido, utilizado como alternativa para login',
                        },
                        role: {
                            type: 'string',
                            title: 'Cargo do usuário',
                            $ref: '#/components/schemas/Role',
                        },
                        createdAt: {
                            type: 'string',
                            title: 'Data de criação',
                            format: 'date-time',
                        },
                        updatedAt: {
                            type: 'string',
                            title: 'Data da última atualização',
                            format: 'date-time',
                        },
                        lastLoginAt: {
                            type: 'string',
                            title: 'Data do último login',
                            format: 'date-time',
                        },
                        quotas: {
                            type: 'object',
                            title: 'Cotas de utilização de recursos do sistema',
                            required: [
                                'maxInstances',
                                'allowedInstanceTypes',
                                'canLaunchInstanceWithHibernation',
                            ],
                            properties: {
                                maxInstances: {
                                    type: 'number',
                                    title: 'Número máximo de instâncias',
                                },
                                allowedInstanceTypes: {
                                    type: 'array',
                                    title: 'Tipos de instância permitidos',
                                    items: {
                                        $ref: '#/components/schemas/VirtualInstanceType',
                                    },
                                },
                                canLaunchInstanceWithHibernation: {
                                    type: 'boolean',
                                    title: 'Permissão para lançar instâncias com hibernação',
                                },
                            },
                        },
                    },
                },
                MachineImage: {
                    type: 'object',
                    title: 'Imagem da máquina virtual',
                    description: 'Uma imagem de máquina virtual',
                    required: ['id', 'storageInGb', 'platform', 'distribution'],
                    properties: {
                        id: {
                            type: 'string',
                            title: 'Id da imagem da máquina virtual',
                        },
                        storageInGb: {
                            type: 'number',
                            title: 'Armazenamento em GB',
                        },
                        platform: {
                            type: 'string',
                            title: 'Plataforma da imagem',
                            $ref: '#/components/schemas/InstancePlatform',
                        },
                        distribution: {
                            type: 'string',
                            title: 'Distribuição da imagem',
                        },
                    },
                },
            },
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

    let customDomain: sst.StaticSiteDomainProps | undefined;

    if (
        featureFlagIsEnabled({
            featureFlag: 'DOCS_CUSTOM_DOMAIN',
            components: ['Docs Site Custom Domain'],
            forceDisable: app.mode === 'dev',
        })
    ) {
        const domainName = process.env.DOCS_CUSTOM_DOMAIN_NAME;
        const certificateArn = process.env.DOCS_CUSTOM_DOMAIN_CERTIFICATE_ARN;

        if (domainName === undefined || certificateArn === undefined) {
            throw new Error(
                'DOCS_CUSTOM_DOMAIN_NAME and DOCS_CUSTOM_DOMAIN_CERTIFICATE_ARN must be set when DOCS_CUSTOM_DOMAIN is enabled.',
            );
        }

        customDomain = {
            isExternalDomain: true,
            domainName: domainName,
            cdk: {
                certificate: acm.Certificate.fromCertificateArn(
                    stack,
                    'ClientCertificate',
                    certificateArn,
                ),
            },
        };
    }

    const docsSite = new sst.StaticSite(stack, 'DocsSite', {
        path: 'packages/docs',
        buildCommand: 'npm run build',
        customDomain,
        buildOutput: 'build',
        assets: {
            fileOptions: [
                {
                    files: '**',
                    cacheControl: 'max-age=0,no-cache,no-store,must-revalidate',
                },
                {
                    files: '**/*.{js,css}',
                    cacheControl: 'max-age=31536000,public,immutable',
                },
                {
                    files: '**/*.{png,jpg,jpeg,gif,svg,ico}',
                    cacheControl: 'max-age=31536000,public,immutable',
                },
            ],
        },
        environment: {
            API_DOCUMENTATION_SPEC_URL: openApiSpecs.getSpecsUrl(),
        },
    });

    stack.addOutputs({
        docsSiteUrl: docsSite.customDomainUrl ?? docsSite.url ?? 'http://localhost:3000/',
        docsSiteDistributionUrl: docsSite.url,
        openApiSpecsUrl: openApiSpecs.getSpecsUrl(),
    });

    return {
        docsSite,
    };
}
