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
        serviceCatalogLinuxProductId: {
            name: `/virtual-lab/${stack.stage}/service-catalog-linux-product-id`,
        },
        serviceCatalogWindowsProductId: {
            name: `/virtual-lab/${stack.stage}/service-catalog-windows-product-id`,
        },
    };

    const vpc = ec2.Vpc.fromLookup(stack, `DefaultVpc`, { isDefault: true });

    return {
        ssmParameters,
        vpc,
    };
};
