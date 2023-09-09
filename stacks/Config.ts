import * as sst from 'sst/constructs';
import { getSSMParameters } from './utils';

export const Config = async ({ stack }: sst.StackContext) => {
    const { DATABASE_URL } = await getSSMParameters(stack, {
        DATABASE_URL: `/virtual-lab/${stack.stage}/config/database-url`,
    });

    if (typeof DATABASE_URL !== 'string') {
        throw new Error(`DATABASE_URL is not valid. It is ${typeof DATABASE_URL}`);
    }

    return {
        DATABASE_URL,
    };
};
