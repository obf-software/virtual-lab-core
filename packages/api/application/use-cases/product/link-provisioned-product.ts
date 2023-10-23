import { CatalogGateway } from '../../catalog-gateway';
import { Logger } from '../../logger';
import { NotificationPublisher } from '../../notification-publisher';
import { InstanceRepository } from '../../repositories/instance-repository';
import { UserRepository } from '../../repositories/user-repository';
import { VirtualizationGateway } from '../../virtualization-gateway';
import { ApplicationError } from '../../../domain/errors/application-error';
import { InstanceProvisionedNotification } from '../../../domain/notifications/instance-provisioned-notification';

export interface LinkProvisionedProductInput {
    provisionedProductStackName: string;
}

export type LinkProvisionedProductOutput = void;

export class LinkProvisionedProduct {
    constructor(
        private readonly logger: Logger,
        private readonly userRepository: UserRepository,
        private readonly instanceRepository: InstanceRepository,
        private readonly virtualizationGateway: VirtualizationGateway,
        private readonly catalogGateway: CatalogGateway,
        private readonly notificationPublisher: NotificationPublisher,
    ) {}

    execute = async (input: LinkProvisionedProductInput): Promise<LinkProvisionedProductOutput> => {
        this.logger.debug('LinkProvisionedProduct.execute', { input });

        const provisionedProduct = await this.catalogGateway.getProvisionedProductByStackName(
            input.provisionedProductStackName,
        );

        const [virtualInstance, instance] = await Promise.all([
            this.virtualizationGateway.getInstanceDetailedInfoById(provisionedProduct.instanceId),
            this.instanceRepository.getByProvisionToken(provisionedProduct.provisionToken),
        ]);

        if (!instance) throw ApplicationError.resourceNotFound();

        instance.onProvisioned({
            connectionType: provisionedProduct.connectionType,
            logicalId: virtualInstance.id,
            cpuCores: virtualInstance.cpuCores,
            distribution: virtualInstance.distribution,
            instanceType: virtualInstance.instanceType,
            memoryInGb: virtualInstance.memoryInGb,
            platform: virtualInstance.platform,
            storageInGb: virtualInstance.storageInGb,
        });

        const [user] = await Promise.all([
            this.userRepository.getById(instance.getData().userId),
            this.instanceRepository.update(instance),
        ]);

        if (!user) throw ApplicationError.resourceNotFound();

        const notification = new InstanceProvisionedNotification(
            user.getData().username,
            instance,
            virtualInstance.state,
        );

        await this.notificationPublisher.publish(notification);
    };

    // execute = async (props: { stackName: string }) => {
    //     const productStack = await this.cloudFormation.describeStackByName(props.stackName);

    //     if (!productStack) {
    //         throw new createHttpError.InternalServerError(`Stack ${props.stackName} not found`);
    //     }

    //     const { provisionedProductName } = (productStack.Tags?.reduce((acc, tag) => {
    //         if (tag.Key !== undefined) return { ...acc, [tag.Key]: tag.Value };
    //         return acc;
    //     }, {}) ?? {}) as { provisionedProductName?: string };

    //     const { connectionType, awsInstanceId } = productStack.Outputs?.reduce((acc, output) => {
    //         if (output.Description !== undefined)
    //             return { ...acc, [output.Description]: output.OutputValue };
    //         return acc;
    //     }, {}) as { connectionType?: string; awsInstanceId?: string };

    //     if (!provisionedProductName || !connectionType || !awsInstanceId) {
    //         throw new createHttpError.InternalServerError(
    //             `Stack ${props.stackName} is missing required params: ${JSON.stringify({
    //                 provisionedProductName,
    //                 connectionType,
    //                 awsInstanceId,
    //             })}`,
    //         );
    //     }

    //     const awsInstance = await this.ec2.getInstance(awsInstanceId);

    //     if (
    //         !awsInstance?.InstanceType ||
    //         !awsInstance.ImageId ||
    //         !awsInstance.BlockDeviceMappings
    //     ) {
    //         throw new createHttpError.InternalServerError(
    //             `EC2 instance ${awsInstanceId} is missing missing internal params`,
    //         );
    //     }

    //     const [awsInstanceType, awsImageDescription, awsInstanceTotalDiskSize, [instanceStatuse]] =
    //         await Promise.all([
    //             this.ec2.getInstanceTypeData(awsInstance?.InstanceType ?? ''),
    //             this.ec2.getImageDescription(awsInstance?.ImageId ?? ''),
    //             this.ec2.getVolumesTotalSize(
    //                 awsInstance?.BlockDeviceMappings?.map((bdm) => bdm.Ebs?.VolumeId ?? '') ?? [],
    //             ),
    //             this.ec2.listInstanceStatuses([awsInstanceId]),
    //         ]);

    //     const updatedInstance = await this.instanceRepository.updateByAwsProvisionedProductName(
    //         provisionedProductName,
    //         {
    //             awsInstanceId,
    //             connectionType:
    //                 connectionType as keyof typeof schema.instanceConnectionType.enumValues.values,
    //             cpuCores: awsInstance?.CpuOptions?.CoreCount?.toString(),
    //             distribution: awsImageDescription,
    //             platform: awsInstance?.PlatformDetails,
    //             storageInGb: awsInstanceTotalDiskSize?.toString(),
    //             instanceType: awsInstance?.InstanceType,
    //             memoryInGb:
    //                 awsInstanceType?.MemoryInfo?.SizeInMiB !== undefined
    //                     ? `${awsInstanceType?.MemoryInfo?.SizeInMiB / 1024}`
    //                     : undefined,
    //         },
    //     );

    //     if (!updatedInstance) {
    //         throw new createHttpError.InternalServerError(
    //             `Instance ${provisionedProductName} not found`,
    //         );
    //     }

    //     // return {
    //     //     ...updatedInstance,
    //     //     state: instanceStatuse?.InstanceState?.Name,
    //     // };

    //     const user = await this.userRepository.getById(updatedInstance.userId);

    //     if (!user) {
    //         throw new createHttpError.InternalServerError(
    //             `User ${updatedInstance.userId} not found`,
    //         );
    //     }

    //     await this.appSync.publishMutation(user.username, {
    //         type: 'EC2_INSTANCE_PROVISIONED',
    //         instance: {
    //             ...updatedInstance,
    //             state: instanceStatuse?.InstanceState?.Name,
    //         },
    //     });
    // };
}
