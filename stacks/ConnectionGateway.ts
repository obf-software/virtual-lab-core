import * as sst from 'sst/constructs';
import { Core } from './Core';

export const ConnectionGateway = ({ stack }: sst.StackContext) => {
    const { vpc, ssmParameters, defaultEventBus } = sst.use(Core);

    const connectionGatewayService = new sst.Service(stack, 'ConnectionGatewayService', {
        path: 'packages/connection-gateway',
        port: 8080,
        memory: '0.5 GB',
        cpu: '0.25 vCPU',
        storage: '20 GB',
        environment: {
            PORT: '8080',
            VL_GUACAMOLE_CYPHER_KEY_PARAMETER_NAME: ssmParameters.guacamoleCypherKey.name,
            VL_EVENT_BUS_ARN: defaultEventBus.eventBusArn,
        },
        permissions: ['events:*', 'ssm:*'],
        scaling: {
            minContainers: 1,
            maxContainers: 10,
            requestsPerContainer: 1000,
            cpuUtilization: 70,
            memoryUtilization: 70,
        },
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
