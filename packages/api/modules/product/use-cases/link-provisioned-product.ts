import createHttpError from 'http-errors';
import { IUseCase } from '../../../domain/interfaces';
import { CloudFormation } from '../../../infrastructure/aws/cloud-formation';
import { EC2 } from '../../../infrastructure/aws/ec2';
import { InstanceRepository, UserRepository, schema } from '../../../infrastructure/repositories';
import { AppSync } from '../../../infrastructure/aws/app-sync';

export class LinkProvisionedProductUseCase implements IUseCase {
    constructor(
        private readonly cloudFormation: CloudFormation,
        private readonly ec2: EC2,
        private readonly appSync: AppSync,
        private readonly instanceRepository: InstanceRepository,
        private readonly userRepository: UserRepository,
    ) {}

    execute = async (props: { stackName: string }) => {
        const productStack = await this.cloudFormation.describeStackByName(props.stackName);

        if (!productStack) {
            throw new createHttpError.InternalServerError(`Stack ${props.stackName} not found`);
        }

        const { provisionedProductName } = (productStack.Tags?.reduce((acc, tag) => {
            if (tag.Key !== undefined) return { ...acc, [tag.Key]: tag.Value };
            return acc;
        }, {}) ?? {}) as { provisionedProductName?: string };

        const { connectionType, awsInstanceId } = productStack.Outputs?.reduce((acc, output) => {
            if (output.Description !== undefined)
                return { ...acc, [output.Description]: output.OutputValue };
            return acc;
        }, {}) as { connectionType?: string; awsInstanceId?: string };

        if (!provisionedProductName || !connectionType || !awsInstanceId) {
            throw new createHttpError.InternalServerError(
                `Stack ${props.stackName} is missing required params: ${JSON.stringify({
                    provisionedProductName,
                    connectionType,
                    awsInstanceId,
                })}`,
            );
        }

        const awsInstance = await this.ec2.getInstance(awsInstanceId);

        if (
            !awsInstance?.InstanceType ||
            !awsInstance.ImageId ||
            !awsInstance.BlockDeviceMappings
        ) {
            throw new createHttpError.InternalServerError(
                `EC2 instance ${awsInstanceId} is missing missing internal params`,
            );
        }

        const [awsInstanceType, awsImageDescription, awsInstanceTotalDiskSize, [instanceStatuse]] =
            await Promise.all([
                this.ec2.getInstanceTypeData(awsInstance?.InstanceType ?? ''),
                this.ec2.getImageDescription(awsInstance?.ImageId ?? ''),
                this.ec2.getVolumesTotalSize(
                    awsInstance?.BlockDeviceMappings?.map((bdm) => bdm.Ebs?.VolumeId ?? '') ?? [],
                ),
                this.ec2.listInstanceStatuses([awsInstanceId]),
            ]);

        const updatedInstance = await this.instanceRepository.updateByAwsProvisionedProductName(
            provisionedProductName,
            {
                awsInstanceId,
                connectionType:
                    connectionType as keyof typeof schema.instanceConnectionType.enumValues.values,
                cpuCores: awsInstance?.CpuOptions?.CoreCount?.toString(),
                distribution: awsImageDescription,
                platform: awsInstance?.PlatformDetails,
                storageInGb: awsInstanceTotalDiskSize?.toString(),
                instanceType: awsInstance?.InstanceType,
                memoryInGb:
                    awsInstanceType?.MemoryInfo?.SizeInMiB !== undefined
                        ? `${awsInstanceType?.MemoryInfo?.SizeInMiB / 1024}`
                        : undefined,
            },
        );

        if (!updatedInstance) {
            throw new createHttpError.InternalServerError(
                `Instance ${provisionedProductName} not found`,
            );
        }

        // return {
        //     ...updatedInstance,
        //     state: instanceStatuse?.InstanceState?.Name,
        // };

        const user = await this.userRepository.getById(updatedInstance.userId);

        if (!user) {
            throw new createHttpError.InternalServerError(
                `User ${updatedInstance.userId} not found`,
            );
        }

        await this.appSync.publishMutation(user.username, {
            type: 'EC2_INSTANCE_PROVISIONED',
            instance: {
                ...updatedInstance,
                state: instanceStatuse?.InstanceState?.Name,
            },
        });
    };
}
