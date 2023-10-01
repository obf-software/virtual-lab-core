import { AwsEc2Integration } from '../../integrations/aws-ec2/service';
import { GuacamoleIntegration } from '../../integrations/guacamole/service';
import { InstanceRepository } from './repository';
import * as schema from '../../drizzle/schema';
import { AwsServiceCatalogIntegration } from '../../integrations/aws-service-catalog/service';

export class InstanceService {
    private INSTANCE_PASSWORD: string;
    private GUACAMOLE_CYPHER_KEY: string;
    private instanceRepository: InstanceRepository;
    private awsEc2Integration: AwsEc2Integration;
    private guacamoleIntegration: GuacamoleIntegration;
    private awsServiceCatalogIntegration: AwsServiceCatalogIntegration;

    constructor(props: {
        INSTANCE_PASSWORD: string;
        GUACAMOLE_CYPHER_KEY: string;
        instanceRepository: InstanceRepository;
        awsEc2Integration: AwsEc2Integration;
        guacamoleIntegration: GuacamoleIntegration;
        awsServiceCatalogIntegration: AwsServiceCatalogIntegration;
    }) {
        this.INSTANCE_PASSWORD = props.INSTANCE_PASSWORD;
        this.GUACAMOLE_CYPHER_KEY = props.GUACAMOLE_CYPHER_KEY;
        this.instanceRepository = props.instanceRepository;
        this.awsEc2Integration = props.awsEc2Integration;
        this.guacamoleIntegration = props.guacamoleIntegration;
        this.awsServiceCatalogIntegration = props.awsServiceCatalogIntegration;
    }

    async getInstanceByAwsInstanceId(awsInstanceId: string) {
        return await this.instanceRepository.getInstanceByAwsInstanceId(awsInstanceId);
    }

    async getInstanceById(instanceId: number) {
        return await this.instanceRepository.getInstanceById(instanceId);
    }

    async listUserInstances(
        userId: number,
        pagination: {
            resultsPerPage: number;
            page: number;
        },
    ) {
        const instances = await this.instanceRepository.listUserInstances(userId, pagination);
        if (instances.data.length === 0) {
            return instances;
        }

        const awsInstanceIds: string[] = instances.data
            .filter((i) => i.awsInstanceId !== null)
            .map((i) => i.awsInstanceId!);

        const instanceStatuses =
            awsInstanceIds.length > 0
                ? await this.awsEc2Integration.listInstanceStatuses(awsInstanceIds)
                : [];
        const instanceStatesByInstanceId = instanceStatuses.reduce(
            (acc, curr) => {
                if (curr.InstanceId !== undefined) {
                    acc[curr.InstanceId] = curr.InstanceState?.Name;
                }
                return acc;
            },
            {} as Record<string, string | undefined>,
        );
        const instancesWithStates = instances.data.map((i) => ({
            ...i,
            state: instanceStatesByInstanceId[i.awsInstanceId ?? ''],
        }));

        return {
            ...instances,
            data: instancesWithStates,
        };
    }

    async changeInstanceState(awsInstanceId: string, state: 'start' | 'stop' | 'reboot') {
        switch (state) {
            case 'start':
                return await this.awsEc2Integration.startInstance(awsInstanceId);
            case 'stop':
                return await this.awsEc2Integration.stopInstance(awsInstanceId, false, false);
            case 'reboot':
                await this.awsEc2Integration.rebootInstance(awsInstanceId);
                return undefined;
        }
    }

    async deleteInstance(instanceId: number) {
        const deletedInstance = await this.instanceRepository.deleteInstance(instanceId);

        if (deletedInstance === undefined) {
            return undefined;
        }

        await this.awsServiceCatalogIntegration.terminateProvisionedProductByName(
            deletedInstance.awsProvisionedProductName,
        );

        return instanceId;
    }

    async getInstanceConnection(instanceId: number) {
        const instance = await this.instanceRepository.getInstanceById(instanceId);

        if (instance === undefined) {
            throw new Error('Instance not found');
        }

        if (instance.awsInstanceId === null) {
            throw new Error('Instance does not have an AWS instance ID');
        }

        const awsInstance = await this.awsEc2Integration.getInstance(instance.awsInstanceId);

        if (awsInstance?.State?.Name !== 'running') {
            throw new Error('Instance is not running');
        }

        if (awsInstance === undefined) {
            throw new Error('AWS Instance not found');
        }

        const { PublicDnsName } = awsInstance;

        if (PublicDnsName === undefined) {
            throw new Error('Instance does not have a public DNS name');
        }

        let connectionString: string | undefined = undefined;
        if (instance.connectionType === 'VNC') {
            connectionString = this.guacamoleIntegration.createVncConnectionString(
                this.GUACAMOLE_CYPHER_KEY,
                {
                    hostname: PublicDnsName,
                    port: 5901,
                    cursor: 'local',
                    password: this.INSTANCE_PASSWORD,
                },
            );
        } else {
            throw new Error('Unsupported connection type');
        }

        return {
            connectionString,
        };
    }

    async updateInstanceByAwsProvisionedProductName(
        awsProvisionedProductName: string,
        data: Partial<typeof schema.instance.$inferInsert>,
    ) {
        return await this.instanceRepository.updateInstanceByAwsProvisionedProductName(
            awsProvisionedProductName,
            data,
        );
    }
}
