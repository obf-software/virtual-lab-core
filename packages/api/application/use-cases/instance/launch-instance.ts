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
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly userRepository: UserRepository,
        private readonly instanceRepository: InstanceRepository,
        private readonly instanceTemplateRepository: InstanceTemplateRepository,
        private readonly virtualizationGateway: VirtualizationGateway,
    ) {}

    execute = async (input: LaunchInstanceInput): Promise<LaunchInstanceOutput> => {
        this.logger.debug('LaunchInstance.execute', { input });

        const inputValidation = launchInstanceInputSchema.safeParse(input);
        if (!inputValidation.success) throw Errors.validationError(inputValidation.error);
        const { data: validInput } = inputValidation;

        this.auth.assertThatHasRoleOrAbove(validInput.principal, 'USER');
        const { id } = this.auth.getClaims(validInput.principal);
        const ownerId = validInput.ownerId ?? id;

        const [user, userInstanceCount, instanceTemplate, instanceType] = await Promise.all([
            this.userRepository.getById(ownerId),
            this.instanceRepository.count({ ownerId: ownerId }),
            this.instanceTemplateRepository.getById(validInput.templateId),
            this.virtualizationGateway.getInstanceType(validInput.instanceType),
        ]);

        if (!user) {
            throw Errors.resourceNotFound('User', ownerId);
        }

        if (!instanceTemplate) {
            throw Errors.resourceNotFound('InstanceTemplate', validInput.templateId);
        }

        if (!instanceType) {
            throw Errors.resourceNotFound('InstanceType', validInput.instanceType);
        }

        const instanceMachineImage = await this.virtualizationGateway.getMachineImageById(
            instanceTemplate.getData().machineImageId,
        );

        if (!instanceMachineImage) {
            throw Errors.resourceNotFound(
                'MachineImageId',
                instanceTemplate.getData().machineImageId,
            );
        }

        if (!this.auth.hasRoleOrAbove(validInput.principal, 'ADMIN')) {
            if (ownerId !== id) {
                throw Errors.insufficientRole('ADMIN');
            }

            const { maxInstances, allowedInstanceTypes, canLaunchInstanceWithHibernation } =
                user.getData().quotas;

            if (userInstanceCount >= maxInstances) {
                throw Errors.businessRuleViolation('Max instances reached');
            }

            if (!allowedInstanceTypes.includes(validInput.instanceType)) {
                throw Errors.businessRuleViolation(
                    `Instance type "${validInput.instanceType}" not allowed`,
                );
            }

            if (!canLaunchInstanceWithHibernation && validInput.canHibernate) {
                throw Errors.businessRuleViolation('Hibernation not allowed');
            }
        }

        const launchToken = await this.virtualizationGateway.launchInstance(
            instanceTemplate.getData().productId,
            {
                instanceType: validInput.instanceType,
                canHibernate: validInput.canHibernate,
                machineImageId: instanceTemplate.getData().machineImageId,
                storageInGb: instanceTemplate.getData().storageInGb,
            },
        );

        const instance = Instance.create({
            ownerId,
            launchToken,
            name: validInput.name,
            description: validInput.description,
            canHibernate: validInput.canHibernate,
            platform: instanceMachineImage.platform,
            distribution: instanceMachineImage.distribution,
            instanceType: instanceType.name,
            cpuCores: instanceType.cpuCores,
            memoryInGb: instanceType.memoryInGb,
            storageInGb: instanceTemplate.getData().storageInGb.toString(),
        });
        instance.id = await this.instanceRepository.save(instance);

        return instance;
    };
}
