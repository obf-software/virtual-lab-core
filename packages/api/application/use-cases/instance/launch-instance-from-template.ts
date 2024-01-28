import { z } from 'zod';
import { Instance } from '../../../domain/entities/instance';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { principalSchema } from '../../../domain/dtos/principal';
import { UserRepository } from '../../user-repository';
import { InstanceRepository } from '../../instance-repository';
import { VirtualizationGateway } from '../../virtualization-gateway';
import { Errors } from '../../../domain/dtos/errors';

export const provisionProductInputSchema = z
    .object({
        principal: principalSchema,
        userId: z.string().optional(),
        templateId: z.string().nonempty(),
        instanceType: z.string().nonempty(),
        enableHibernation: z.boolean(),
    })
    .strict();
export type ProvisionProductInput = z.infer<typeof provisionProductInputSchema>;

export type ProvisionProductOutput = Instance;

export class ProvisionProduct {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly userRepository: UserRepository,
        private readonly instanceRepository: InstanceRepository,
        private readonly virtualizationGateway: VirtualizationGateway,
    ) {}

    execute = async (input: ProvisionProductInput): Promise<ProvisionProductOutput> => {
        this.logger.debug('ProvisionProduct.execute', { input });

        const inputValidation = provisionProductInputSchema.safeParse(input);
        if (!inputValidation.success) throw Errors.validationError(inputValidation.error);
        const { data: validInput } = inputValidation;

        this.auth.assertThatHasRoleOrAbove(validInput.principal, 'USER');
        const { id } = this.auth.getClaims(validInput.principal);
        const userId = validInput.userId ?? id;

        const [user, userInstanceCount] = await Promise.all([
            this.userRepository.getById(userId),
            this.instanceRepository.count({ ownerId: userId }),
        ]);
        if (!user) throw Errors.resourceNotFound('User', userId);

        if (!this.auth.hasRoleOrAbove(validInput.principal, 'ADMIN')) {
            if (userId !== id) {
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

        const [launchToken, instanceTemplate] = await Promise.all([
            this.virtualizationGateway.launchInstance(validInput.templateId, {
                instanceType: validInput.instanceType,
                enableHibernation: validInput.enableHibernation,
            }),
            this.virtualizationGateway.getInstanceTemplate(validInput.templateId),
        ]);

        const instance = Instance.create({
            name: instanceTemplate.name,
            description: instanceTemplate.description,
            ownerId: userId,
            launchToken,
        });
        instance.id = await this.instanceRepository.save(instance);
        return instance;
    };
}
