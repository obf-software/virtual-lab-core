import { z } from 'zod';
import { principalSchema } from '../../../domain/dtos/principal';
import { Group } from '../../../domain/entities/group';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { GroupRepository } from '../../group-repository';
import { Errors } from '../../../domain/dtos/errors';

export const updateGroupInputSchema = z
    .object({
        principal: principalSchema,
        groupId: z.string().nonempty(),
        name: z.string().nonempty().optional(),
        description: z.string().nonempty().optional(),
    })
    .refine((data) => !!(data.name !== undefined || data.description !== undefined), {
        message: 'At least one of name or description must be provided',
        path: ['name', 'description'],
    });
export type UpdateGroupInput = z.infer<typeof updateGroupInputSchema>;

export type UpdateGroupOutput = Group;

export class UpdateGroup {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly groupRepository: GroupRepository,
    ) {}

    execute = async (input: UpdateGroupInput): Promise<UpdateGroupOutput> => {
        this.logger.debug('UpdateGroup.execute', { input });

        const inputValidation = updateGroupInputSchema.safeParse(input);
        if (!inputValidation.success) throw Errors.validationError(inputValidation.error);
        const { data: validInput } = inputValidation;

        this.auth.assertThatHasRoleOrAbove(validInput.principal, 'ADMIN');

        const group = await this.groupRepository.getById(input.groupId);
        if (!group) throw Errors.resourceNotFound('Group', input.groupId);
        group.update({ name: input.name, description: input.description });
        await this.groupRepository.update(group);
        return group;
    };
}
