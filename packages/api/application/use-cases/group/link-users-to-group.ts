import { z } from 'zod';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { principalSchema } from '../../../domain/dtos/principal';
import { GroupRepository } from '../../group-repository';
import { Errors } from '../../../domain/dtos/errors';

export const linkUsersToGroupInputSchema = z.object({
    principal: principalSchema,
    groupId: z.string(),
    userIds: z.array(z.string()),
});
export type LinkUsersToGroupInput = z.infer<typeof linkUsersToGroupInputSchema>;

export type LinkUsersToGroupOutput = void;

export class LinkUsersToGroup {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly groupRepository: GroupRepository,
    ) {}

    execute = async (input: LinkUsersToGroupInput): Promise<LinkUsersToGroupOutput> => {
        this.logger.debug('LinkUsersToGroup.execute', { input });

        const inputValidation = linkUsersToGroupInputSchema.safeParse(input);
        if (!inputValidation.success) throw Errors.validationError(inputValidation.error);
        const { data: validInput } = inputValidation;

        this.auth.assertThatHasRoleOrAbove(validInput.principal, 'ADMIN');

        await this.groupRepository.linkUsers(validInput.groupId, validInput.userIds);
    };
}
