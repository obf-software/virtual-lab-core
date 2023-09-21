import * as sst from 'sst/constructs';
import { getSSMParameters } from './utils';

/**
 * TODO: Instead of fetching the parameters from SSM at deploy time, we should create the
 * parameters and store them in the stack. This will allow us to use the parameters in
 * the code, making the stack less coupled to the SSM parameters.
 */
export const Config = async ({ stack }: sst.StackContext) => {
    const { DATABASE_URL, INSTANCE_PASSWORD, GUACAMOLE_CYPHER_KEY } = await getSSMParameters(
        stack,
        {
            DATABASE_URL: `/virtual-lab/${stack.stage}/config/database-url`,
            INSTANCE_PASSWORD: `/virtual-lab/${stack.stage}/config/instance-password`,
            GUACAMOLE_CYPHER_KEY: `/virtual-lab/${stack.stage}/config/guacamole-cypher-key`,
        },
    );

    if (typeof DATABASE_URL !== 'string') {
        throw new Error(`DATABASE_URL is not valid. It is ${typeof DATABASE_URL}`);
    }

    if (typeof INSTANCE_PASSWORD !== 'string') {
        throw new Error(`INSTANCE_PASSWORD is not valid. It is ${typeof INSTANCE_PASSWORD}`);
    }

    if (typeof GUACAMOLE_CYPHER_KEY !== 'string') {
        throw new Error(`GUACAMOLE_CYPHER_KEY is not valid. It is ${typeof GUACAMOLE_CYPHER_KEY}`);
    }

    return {
        DATABASE_URL,
        INSTANCE_PASSWORD,
        GUACAMOLE_CYPHER_KEY,
    };
};
