import { z } from 'zod';
import { Instance } from '../../../domain/entities/instance';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { principalSchema } from '../../../domain/dtos/principal';
import { UserRepository } from '../../user-repository';
import { InstanceRepository } from '../../instance-repository';
import { VirtualizationGateway } from '../../virtualization-gateway';
import { Errors } from '../../../domain/dtos/errors';
import { InstanceTemplateRepository } from '../../instance-template-repository';
import { useCaseExecute } from '../../../domain/decorators/use-case-execute';
import { MachineImageState } from '../../../domain/dtos/machine-image-state';

export const launchInstanceInputSchema = z
    .object({
        principal: principalSchema,
        ownerId: z.string().min(1).optional(),
        templateId: z.string().min(1),
        name: z.string().min(1),
        description: z.string().min(1),
        instanceType: z.string().min(1),
        canHibernate: z.boolean(),
    })
    .strict();
export type LaunchInstanceInput = z.infer<typeof launchInstanceInputSchema>;

export type LaunchInstanceOutput = Instance;

export class LaunchInstance {
    constructor(
        readonly logger: Logger,
        private readonly auth: Auth,
        private readonly userRepository: UserRepository,
        private readonly instanceRepository: InstanceRepository,
        private readonly instanceTemplateRepository: InstanceTemplateRepository,
        private readonly virtualizationGateway: VirtualizationGateway,
    ) {}

    @useCaseExecute(launchInstanceInputSchema)
    async execute(input: LaunchInstanceInput): Promise<LaunchInstanceOutput> {
        this.auth.assertThatHasRoleOrAbove(input.principal, 'USER');
        const { id } = this.auth.getClaims(input.principal);
        const ownerId = input.ownerId ?? id;

        const [user, userInstanceCount, instanceTemplate, instanceType] = await Promise.all([
            this.userRepository.getById(ownerId),
            this.instanceRepository.count({ ownerId: ownerId }),
            this.instanceTemplateRepository.getById(input.templateId),
            this.virtualizationGateway.getInstanceType(input.instanceType),
        ]);

        if (!user) {
            throw Errors.resourceNotFound('User', ownerId);
        }

        if (!instanceTemplate) {
            throw Errors.resourceNotFound('InstanceTemplate', input.templateId);
        }

        if (!instanceType) {
            throw Errors.resourceNotFound('InstanceType', input.instanceType);
        }

        const instanceMachineImage = await this.virtualizationGateway.getMachineImageById(
            instanceTemplate.getData().machineImageId,
        );

        if (!instanceMachineImage) {
            throw Errors.resourceNotFound(
                'MachineImage',
                instanceTemplate.getData().machineImageId,
            );
        }

        if (instanceMachineImage.state !== 'AVAILABLE') {
            const machineImageStateToReasonMap: Record<MachineImageState, string> = {
                AVAILABLE: 'Machine Image is available',
                DEREGISTERED: 'Machine Image is deregistered. Please contact support.',
                DISABLED: 'Machine Image is disabled. Please contact support.',
                ERROR: 'Machine Image is in error state. Please contact support.',
                FAILED: 'Machine Image failed to launch. Please contact support.',
                INVALID: 'Machine Image is invalid. Please contact support.',
                PENDING: 'Machine Image is being processed. Please try again later.',
                TRANSIENT: 'Machine Image is transient. Please contact support.',
            };

            throw Errors.businessRuleViolation(
                machineImageStateToReasonMap[instanceMachineImage.state] ??
                    'Machine Image is not available',
            );
        }

        if (!this.auth.hasRoleOrAbove(input.principal, 'ADMIN')) {
            if (ownerId !== id) {
                throw Errors.insufficientRole('ADMIN');
            }

            const { maxInstances, canLaunchInstanceWithHibernation } = user.getData().quotas;

            if (userInstanceCount >= maxInstances) {
                throw Errors.businessRuleViolation('Max instances reached');
            }

            if (!user.canUseInstanceType(instanceType)) {
                throw Errors.businessRuleViolation(
                    `Instance type "${input.instanceType}" not allowed`,
                );
            }

            if (!canLaunchInstanceWithHibernation && input.canHibernate) {
                throw Errors.businessRuleViolation('Hibernation not allowed');
            }
        }

        const launchToken = await this.virtualizationGateway.launchInstance(
            instanceTemplate.getData().productId,
            {
                instanceType: input.instanceType,
                canHibernate: input.canHibernate,
                machineImageId: instanceTemplate.getData().machineImageId,
                storageInGb: instanceTemplate.getData().storageInGb,
            },
        );

        const instance = Instance.create({
            productId: instanceTemplate.getData().productId,
            machineImageId: instanceTemplate.getData().machineImageId,
            ownerId,
            launchToken,
            name: input.name,
            description: input.description,
            canHibernate: input.canHibernate,
            platform: instanceMachineImage.platform,
            distribution: instanceMachineImage.distribution,
            instanceType,
            storageInGb: instanceTemplate.getData().storageInGb.toString(),
        });
        instance.id = await this.instanceRepository.save(instance);

        return instance;
    }
}
