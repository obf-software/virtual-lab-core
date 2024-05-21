import { z } from 'zod';
import { Logger } from '../../logger';
import { Auth } from '../../auth';
import { InstanceTemplateRepository } from '../../instance-template-repository';
import { principalSchema } from '../../../domain/dtos/principal';
import { VirtualizationGateway } from '../../virtualization-gateway';
import { Errors } from '../../../domain/dtos/errors';
import { InstanceTemplate } from '../../../domain/entities/instance-template';
import { useCaseExecute } from '../../../domain/decorators/use-case-execute';

export const createInstanceTemplateInputSchema = z.object({
    principal: principalSchema,
    name: z.string().min(1),
    description: z.string().min(1),
    machineImageId: z.string().min(1),
    storageInGb: z.number().int().min(1).optional(),
});

export type CreateInstanceTemplateInput = z.infer<typeof createInstanceTemplateInputSchema>;

export type CreateInstanceTemplateOutput = InstanceTemplate;

export class CreateInstanceTemplate {
    constructor(
        readonly logger: Logger,
        private readonly auth: Auth,
        private readonly instanceTemplateRepository: InstanceTemplateRepository,
        private readonly virtualizationGateway: VirtualizationGateway,
    ) {}

    @useCaseExecute(createInstanceTemplateInputSchema)
    async execute(input: CreateInstanceTemplateInput): Promise<CreateInstanceTemplateOutput> {
        this.auth.assertThatHasRoleOrAbove(input.principal, 'ADMIN');
        const { id } = this.auth.getClaims(input.principal);

        const machineImage = await this.virtualizationGateway.getMachineImageById(
            input.machineImageId,
        );

        if (!machineImage) {
            throw Errors.resourceNotFound('MachineImage', input.machineImageId);
        }

        if (machineImage.platform === 'UNKNOWN') {
            throw Errors.businessRuleViolation('Cannot create a template from an unknown platform');
        }

        const product = await this.virtualizationGateway.getProductByInstancePlatform(
            machineImage.platform,
        );

        const storageInGb = input.storageInGb ?? machineImage.storageInGb;

        if (storageInGb < machineImage.storageInGb) {
            throw Errors.businessRuleViolation(
                'StorageInGb cannot be less than the storageInGb of the machine image',
            );
        }

        const instanceTemplate = InstanceTemplate.create({
            createdBy: id,
            name: input.name,
            description: input.description,
            productId: product.id,
            machineImageId: machineImage.id,
            platform: machineImage.platform,
            distribution: machineImage.distribution,
            storageInGb,
        });
        instanceTemplate.id = await this.instanceTemplateRepository.save(instanceTemplate);

        return instanceTemplate;
    }
}
