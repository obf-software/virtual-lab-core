import { z } from 'zod';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { principalSchema } from '../../../domain/dtos/principal';
import { GroupRepository } from '../../group-repository';
import { Errors } from '../../../domain/dtos/errors';

export const unlinkUsersFromGroupInputSchema = z.object({
    principal: principalSchema,
    groupId: z.string().nonempty(),
    userIds: z.array(z.string()).nonempty(),
});
export type UnlinkUsersFromGroupInput = z.infer<typeof unlinkUsersFromGroupInputSchema>;

export type UnlinkUsersFromGroupOutput = void;

export class UnlinkUsersFromGroup {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly groupRepository: GroupRepository,
    ) {}

    execute = async (input: UnlinkUsersFromGroupInput): Promise<UnlinkUsersFromGroupOutput> => {
        this.logger.debug('UnlinkUsersFromGroup.execute', { input });

        const inputValidation = unlinkUsersFromGroupInputSchema.safeParse(input);
        if (!inputValidation.success) throw Errors.validationError(inputValidation.error);
        const { data: validInput } = inputValidation;

        this.auth.assertThatHasRoleOrAbove(validInput.principal, 'ADMIN');

        await this.groupRepository.unlinkUsers(validInput.groupId, validInput.userIds);
    };
}
