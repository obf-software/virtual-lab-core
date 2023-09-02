import { SSTConfig } from 'sst';
import { Api } from './stacks/Api';
import { Auth } from './stacks/Auth';

export default {
    config(_input) {
        return {
            name: 'virtual-lab-core',
            region: 'us-east-1',
        };
    },
    stacks(app) {
        app.stack(Auth);
        app.stack(Api);
    },
} satisfies SSTConfig;
