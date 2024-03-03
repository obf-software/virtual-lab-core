import { z } from 'zod';
import { principalSchema } from '../../../domain/dtos/principal';
import { User } from '../../../domain/entities/user';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { UserRepository } from '../../user-repository';
import { Errors } from '../../../domain/dtos/errors';

export const updateUserQuotasInput = z
    .object({
        principal: principalSchema,
        userId: z.string().min(1).optional(),
        maxInstances: z.number().min(0).optional(),
        allowedInstanceTypes: z.array(z.string()).nonempty().optional(),
        canLaunchInstanceWithHibernation: z.boolean().optional(),
    })
    .strict()
    .refine(
        (data) =>
            !!(
                data.maxInstances !== undefined ||
                data.allowedInstanceTypes !== undefined ||
                data.canLaunchInstanceWithHibernation !== undefined
            ),
        {
            message: 'At least one quota must be provided',
            path: ['maxInstances', 'allowedInstanceTypes', 'canLaunchInstanceWithHibernation'],
        },
    );
export type UpdateUserQuotasInput = z.infer<typeof updateUserQuotasInput>;

export type UpdateUserQuotasOutput = User;

export class UpdateUserQuotas {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly userRepository: UserRepository,
    ) {}

    execute = async (input: UpdateUserQuotasInput): Promise<UpdateUserQuotasOutput> => {
        this.logger.debug('UpdateUserQuotas.execute', { input });

        const inputValidation = updateUserQuotasInput.safeParse(input);
        if (!inputValidation.success) throw Errors.validationError(inputValidation.error);
        const { data: validInput } = inputValidation;

        this.auth.assertThatHasRoleOrAbove(validInput.principal, 'ADMIN');
        const { id } = this.auth.getClaims(validInput.principal);

        const userId = validInput.userId ?? id;

        const user = await this.userRepository.getById(userId);
        if (!user) throw Errors.resourceNotFound('User', userId);

        user.update({
            maxInstances: validInput.maxInstances,
            allowedInstanceTypes: validInput.allowedInstanceTypes,
            canLaunchInstanceWithHibernation: validInput.canLaunchInstanceWithHibernation,
        });

        await this.userRepository.update(user);
        return user;
    };
}
