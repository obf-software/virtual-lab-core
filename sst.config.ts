import { SSTConfig } from 'sst';
import { Api } from './stacks/Api';
import { Auth } from './stacks/Auth';
import { Client } from './stacks/Client';

export default {
    config() {
        return {
            name: 'virtual-lab-core',
            region: 'us-east-1',
        };
    },
    stacks(app) {
        app.stack(Auth);
        app.stack(Api);
        app.stack(Client);
    },
} satisfies SSTConfig;
