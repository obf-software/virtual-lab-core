import { z } from 'zod';
import { principalSchema } from '../../../domain/dtos/principal';
import { User } from '../../../domain/entities/user';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { UserRepository } from '../../user-repository';
import { Errors } from '../../../domain/dtos/errors';
import { VirtualizationGateway } from '../../virtualization-gateway';
import { useCaseExecute } from '../../../domain/decorators/use-case-execute';

export const updateUserQuotasInput = z
    .object({
        principal: principalSchema,
        userId: z.string().min(1).optional(),
        maxInstances: z.number().min(0).optional(),
        allowedInstanceTypes: z.array(z.string()).optional(),
        canLaunchInstanceWithHibernation: z.boolean().optional(),
    })
    .strict()
    .refine(
        (data) =>
            ![
                data.maxInstances,
                data.allowedInstanceTypes,
                data.canLaunchInstanceWithHibernation,
            ].every((key) => key === undefined),
        {
            message: 'At least one quota must be provided',
            path: ['maxInstances', 'allowedInstanceTypes', 'canLaunchInstanceWithHibernation'],
        },
    );
export type UpdateUserQuotasInput = z.infer<typeof updateUserQuotasInput>;

export type UpdateUserQuotasOutput = User;

export class UpdateUserQuotas {
    constructor(
        readonly logger: Logger,
        private readonly auth: Auth,
        private readonly userRepository: UserRepository,
        private readonly virtualizationGateway: VirtualizationGateway,
    ) {}

    @useCaseExecute(updateUserQuotasInput)
    async execute(input: UpdateUserQuotasInput): Promise<UpdateUserQuotasOutput> {
        this.auth.assertThatHasRoleOrAbove(input.principal, 'ADMIN');
        const { id } = this.auth.getClaims(input.principal);

        const userId = input.userId ?? id;

        const user = await this.userRepository.getById(userId);
        if (!user) throw Errors.resourceNotFound('User', userId);

        const instanceTypes =
            input.allowedInstanceTypes !== undefined
                ? await this.virtualizationGateway.listInstanceTypes(input.allowedInstanceTypes)
                : undefined;

        user.update({
            maxInstances: input.maxInstances,
            allowedInstanceTypes: instanceTypes,
            canLaunchInstanceWithHibernation: input.canLaunchInstanceWithHibernation,
        });

        await this.userRepository.update(user);
        return user;
    }
}
