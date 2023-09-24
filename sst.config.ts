import { SSTConfig } from 'sst';
import { Api } from './stacks/Api';
import { Auth } from './stacks/Auth';
import { Client } from './stacks/Client';
import { Config } from './stacks/Config';
import { AppSyncApi } from './stacks/AppSyncApi';
import { ServiceCatalog } from './stacks/ServiceCatalog';

export default {
    config() {
        return {
            name: 'virtual-lab-core',
            region: 'us-east-1',
        };
    },
    async stacks(app) {
        await app.stack(Config);
        app.stack(Auth);
        app.stack(AppSyncApi);
        app.stack(Api);
        app.stack(Client);
        app.stack(ServiceCatalog);
    },
} satisfies SSTConfig;
