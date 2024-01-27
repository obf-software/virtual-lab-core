import { z } from 'zod';
import { principalSchema } from '../../../domain/dtos/principal';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { GroupRepository } from '../../group-repository';
import { Errors } from '../../../domain/dtos/errors';

export const deleteGroupInputSchema = z.object({
    principal: principalSchema,
    groupId: z.string(),
});
export type DeleteGroupInput = z.infer<typeof deleteGroupInputSchema>;

export type DeleteGroupOutput = void;

export class DeleteGroup {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly groupRepository: GroupRepository,
    ) {}

    execute = async (input: DeleteGroupInput): Promise<DeleteGroupOutput> => {
        this.logger.debug('DeleteGroup.execute', { input });

        const inputValidation = deleteGroupInputSchema.safeParse(input);
        if (!inputValidation.success) throw Errors.validationError(inputValidation.error);
        const { data: validInput } = inputValidation;

        this.auth.assertThatHasRoleOrAbove(validInput.principal, 'ADMIN');

        const group = await this.groupRepository.getById(validInput.groupId);
        if (!group) throw Errors.resourceNotFound('Group', validInput.groupId);
        await this.groupRepository.delete(group);
    };
}
