import { SSTConfig } from 'sst';
import { Api } from './stacks/Api';
import { Auth } from './stacks/Auth';
import { Client } from './stacks/Client';
import { Core } from './stacks/Core';
import { AppSyncApi } from './stacks/AppSyncApi';
import { ServiceCatalog } from './stacks/ServiceCatalog';
import { ConnectionGateway } from './stacks/ConnectionGateway';
import { featureFlagIsEnabled } from './stacks/config/feature-flags';
import { Docs } from './stacks/Docs';

export default {
    config() {
        return {
            name: 'virtual-lab-core',
            region: 'us-east-1',
        };
    },
    stacks(app) {
        if (
            featureFlagIsEnabled({
                featureFlag: 'READABLE_LOG_FORMAT',
                components: ['Lambda Powertools Dev Logging'],
                forceEnable: app.mode === 'dev',
            })
        ) {
            app.addDefaultFunctionEnv({ POWERTOOLS_DEV: 'true' });
        }

        app.stack(Core);
        app.stack(Auth);
        app.stack(AppSyncApi);
        app.stack(Api);
        app.stack(Docs);
        app.stack(ServiceCatalog);
        app.stack(ConnectionGateway);
        app.stack(Client);
    },
} satisfies SSTConfig;
