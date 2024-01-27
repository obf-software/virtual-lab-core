import * as sst from 'sst/constructs';

export const Config = ({ stack }: sst.StackContext) => {
    const ssmParameters = {
        databaseUrl: {
            name: `/virtual-lab/${stack.stage}/config/database-url`,
        },
        instancePassword: {
            name: `/virtual-lab/${stack.stage}/config/instance-password`,
        },
        guacamoleCypherKey: {
            name: `/virtual-lab/${stack.stage}/config/guacamole-cypher-key`,
        },
    };

    return {
        ssmParameters,
    };
};
