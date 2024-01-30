import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as sst from 'sst/constructs';

export const Config = ({ stack }: sst.StackContext) => {
    const ssmParameters = {
        databaseUrl: {
            name: `/virtual-lab/${stack.stage}/database-url`,
        },
        instancePassword: {
            name: `/virtual-lab/${stack.stage}/instance-password`,
        },
        guacamoleCypherKey: {
            name: `/virtual-lab/${stack.stage}/guacamole-cypher-key`,
        },
        serviceCatalogPortfolioId: {
            name: `/virtual-lab/${stack.stage}/service-catalog-portfolio-id`,
        },
    };

    const vpc = ec2.Vpc.fromLookup(stack, `DefaultVpc`, { isDefault: true });

    return {
        ssmParameters,
        vpc,
    };
};
