import { z } from 'zod';
import { Logger } from '../../logger';
import { VirtualInstanceType } from '../../../domain/dtos/virtual-instance-type';
import { Auth } from '../../auth';
import { VirtualizationGateway } from '../../virtualization-gateway';
import { principalSchema } from '../../../domain/dtos/principal';
import { useCaseExecute } from '../../../domain/decorators/use-case-execute';

export const listInstanceTypesInputSchema = z.object({
    principal: principalSchema,
});

export type ListInstanceTypesInput = z.infer<typeof listInstanceTypesInputSchema>;

export type ListInstanceTypesOutput = VirtualInstanceType[];

export class ListInstanceTypes {
    constructor(
        readonly logger: Logger,
        private readonly auth: Auth,
        private readonly virtualizationGateway: VirtualizationGateway,
    ) {}

    @useCaseExecute(listInstanceTypesInputSchema)
    async execute(input: ListInstanceTypesInput): Promise<ListInstanceTypesOutput> {
        this.auth.assertThatHasRoleOrAbove(input.principal, 'USER');

        const instanceTypes = await this.virtualizationGateway.listInstanceTypes();
        return instanceTypes;
    }
}
