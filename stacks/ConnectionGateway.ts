import * as sst from 'sst/constructs';
import { Config } from './Config';
import { Api } from './Api';

export const ConnectionGateway = ({ stack }: sst.StackContext) => {
    const { vpc, ssmParameters } = sst.use(Config);
    const { apiEventBus } = sst.use(Api);

    const connectionGatewayService = new sst.Service(stack, 'ConnectionGatewayService', {
        path: 'packages/connection-gateway',
        port: 8080,
        memory: '0.5 GB',
        cpu: '0.25 vCPU',
        storage: '20 GB',
        environment: {
            PORT: '8080',
            VLC_GUACAMOLE_CYPHER_KEY_PARAMETER_NAME: ssmParameters.guacamoleCypherKey.name,
            VLC_EVENT_BUS_ARN: apiEventBus.eventBusArn,
        },
        permissions: ['events:PutEvents', 'ssm:*'],
        cdk: {
            vpc,
        },
    });

    const serviceHttpUrl = connectionGatewayService.url ?? 'http://localhost:8080/';
    const serviceWebsocketUrl = serviceHttpUrl
        .replace('https://', 'ws://')
        .replace('http://', 'ws://');

    stack.addOutputs({
        ConnectionGatewayServiceUrl: serviceHttpUrl,
        ConnectionGatewayServiceWebsocketUrl: serviceWebsocketUrl,
    });

    return {
        connectionGatewayService,
        serviceHttpUrl,
        serviceWebsocketUrl,
    };
};
