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
        ownerId: z.string().optional(),
        templateId: z.string().min(1),
        name: z.string().min(1),
        description: z.string().min(1),
        instanceType: z.string().min(1),
        enableHibernation: z.boolean(),
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

        const [user, userInstanceCount, instanceTemplate] = await Promise.all([
            this.userRepository.getById(ownerId),
            this.instanceRepository.count({ ownerId: ownerId }),
            this.instanceTemplateRepository.getById(validInput.templateId),
        ]);

        if (!user) {
            throw Errors.resourceNotFound('User', ownerId);
        }

        if (!instanceTemplate) {
            throw Errors.resourceNotFound('InstanceTemplate', validInput.templateId);
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

            if (!canLaunchInstanceWithHibernation && validInput.enableHibernation) {
                throw Errors.businessRuleViolation('Hibernation not allowed');
            }
        }

        const launchToken = await this.virtualizationGateway.launchInstance(
            instanceTemplate.getData().productId,
            {
                instanceType: validInput.instanceType,
                enableHibernation: validInput.enableHibernation,
                machineImageId: instanceTemplate.getData().machineImageId,
                storageInGb: instanceTemplate.getData().storageInGb,
            },
        );

        const instance = Instance.create({
            name: validInput.name,
            description: validInput.description,
            ownerId,
            launchToken,
        });
        instance.id = await this.instanceRepository.save(instance);
        return instance;
    };
}
