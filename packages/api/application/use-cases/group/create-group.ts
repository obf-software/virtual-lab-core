import { z } from 'zod';
import { principalSchema } from '../../../domain/dtos/principal';
import { Group } from '../../../domain/entities/group';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { GroupRepository } from '../../group-repository';
import { Errors } from '../../../domain/dtos/errors';

export const createGroupInputSchema = z.object({
    principal: principalSchema,
    name: z.string(),
    description: z.string(),
});
export type CreateGroupInput = z.infer<typeof createGroupInputSchema>;

export type CreateGroupOutput = Group;

export class CreateGroup {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly groupRepository: GroupRepository,
    ) {}

    execute = async (input: CreateGroupInput): Promise<CreateGroupOutput> => {
        this.logger.debug('CreateGroup.execute', { input });

        const inputValidation = createGroupInputSchema.safeParse(input);
        if (!inputValidation.success) throw Errors.validationError(inputValidation.error);
        const { data: validInput } = inputValidation;

        this.auth.assertThatHasRoleOrAbove(validInput.principal, 'ADMIN');
        const { username } = this.auth.getClaims(validInput.principal);

        const group = Group.create({
            name: validInput.name,
            description: validInput.description,
            createdBy: username,
        });
        group.id = await this.groupRepository.save(group);
        return group;
    };
}
