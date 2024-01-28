import { z } from 'zod';
import { principalSchema } from '../../../domain/dtos/principal';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { VirtualInstanceTemplate } from '../../../domain/dtos/virtual-instance-template';
import { VirtualizationGateway } from '../../virtualization-gateway';
import { Errors } from '../../../domain/dtos/errors';

export const listInstanceTemplatesInputSchema = z
    .object({
        principal: principalSchema,
    })
    .strict();
export type ListInstanceTemplatesInput = z.infer<typeof listInstanceTemplatesInputSchema>;

export type ListInstanceTemplatesOutput = VirtualInstanceTemplate[];

export class ListInstanceTemplates {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly virtualizationGateway: VirtualizationGateway,
    ) {}

    execute = async (input: ListInstanceTemplatesInput): Promise<ListInstanceTemplatesOutput> => {
        this.logger.debug('ListInstanceTemplates.execute', { input });

        const inputValidation = listInstanceTemplatesInputSchema.safeParse(input);
        if (!inputValidation.success) throw Errors.validationError(inputValidation.error);
        const { data: validInput } = inputValidation;

        this.auth.assertThatHasRoleOrAbove(validInput.principal, 'USER');

        const instanceTemplates = await this.virtualizationGateway.listInstanceTemplates();
        return instanceTemplates;
    };
}
