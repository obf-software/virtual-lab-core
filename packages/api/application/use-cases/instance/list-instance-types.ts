import { z } from 'zod';
import { Logger } from '../../logger';
import { VirtualInstanceType } from '../../../domain/dtos/virtual-instance-type';
import { Auth } from '../../auth';
import { VirtualizationGateway } from '../../virtualization-gateway';
import { principalSchema } from '../../../domain/dtos/principal';
import { Errors } from '../../../domain/dtos/errors';

export const listInstanceTypesInputSchema = z.object({
    principal: principalSchema,
});

export type ListInstanceTypesInput = z.infer<typeof listInstanceTypesInputSchema>;

export type ListInstanceTypesOutput = VirtualInstanceType[];

export class ListInstanceTypes {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly virtualizationGateway: VirtualizationGateway,
    ) {}

    async execute(input: ListInstanceTypesInput): Promise<ListInstanceTypesOutput> {
        this.logger.debug('ListInstanceTypes.execute', { input });

        const inputValidation = listInstanceTypesInputSchema.safeParse(input);
        if (!inputValidation.success) throw Errors.validationError(inputValidation.error);
        const { data: validInput } = inputValidation;

        this.auth.assertThatHasRoleOrAbove(validInput.principal, 'USER');

        const instanceTypes = await this.virtualizationGateway.listInstanceTypes();
        return instanceTypes;
    }
}
