import { SSTConfig } from 'sst';
import { Api } from './stacks/Api';
import { Auth } from './stacks/Auth';
import { Client } from './stacks/Client';
import { Config } from './stacks/Config';
import { AppSyncApi } from './stacks/AppSyncApi';
import { ServiceCatalog } from './stacks/ServiceCatalog';
import { LambdaLayers } from './stacks/LambdaLayers';
import { ConnectionGateway } from './stacks/ConnectionGateway';

export default {
    config() {
        return {
            name: 'virtual-lab-core',
            region: 'us-east-1',
        };
    },
    stacks(app) {
        app.stack(LambdaLayers);
        app.stack(Config);
        app.stack(Auth);
        app.stack(AppSyncApi);
        app.stack(Api);
        app.stack(ServiceCatalog);
        app.stack(ConnectionGateway);
        app.stack(Client);
    },
} satisfies SSTConfig;
