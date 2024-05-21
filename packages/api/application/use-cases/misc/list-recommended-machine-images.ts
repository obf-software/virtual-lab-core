import { z } from 'zod';

import { principalSchema } from '../../../domain/dtos/principal';
import { MachineImage } from '../../../domain/dtos/machine-image';
import { Logger } from '../../logger';
import { Auth } from '../../auth';
import { VirtualizationGateway } from '../../virtualization-gateway';
import { useCaseExecute } from '../../../domain/decorators/use-case-execute';

export const listRecommendedMachineImagesInputSchema = z.object({
    principal: principalSchema,
});

export type ListRecommendedMachineImagesInput = z.infer<
    typeof listRecommendedMachineImagesInputSchema
>;

export type ListRecommendedMachineImagesOutput = MachineImage[];

export class ListRecommendedMachineImages {
    constructor(
        readonly logger: Logger,
        private readonly auth: Auth,
        private readonly virtualizationGateway: VirtualizationGateway,
    ) {}

    @useCaseExecute(listRecommendedMachineImagesInputSchema)
    async execute(
        input: ListRecommendedMachineImagesInput,
    ): Promise<ListRecommendedMachineImagesOutput> {
        this.auth.assertThatHasRoleOrAbove(input.principal, 'USER');

        const machineImages = await this.virtualizationGateway.listRecommendedMachineImages();
        return machineImages;
    }
}
