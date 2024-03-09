import { z } from 'zod';
import { Logger } from '../../logger';
import { Auth } from '../../auth';
import { InstanceTemplateRepository } from '../../instance-template-repository';
import { principalSchema } from '../../../domain/dtos/principal';
import { VirtualizationGateway } from '../../virtualization-gateway';
import { Errors } from '../../../domain/dtos/errors';
import { InstanceTemplate } from '../../../domain/entities/instance-template';

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
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly instanceTemplateRepository: InstanceTemplateRepository,
        private readonly virtualizationGateway: VirtualizationGateway,
    ) {}

    async execute(input: CreateInstanceTemplateInput): Promise<CreateInstanceTemplateOutput> {
        this.logger.debug('CreateInstanceTemplate.execute', { input });

        const inputValidation = createInstanceTemplateInputSchema.safeParse(input);
        if (!inputValidation.success) throw Errors.validationError(inputValidation.error);
        const { data: validInput } = inputValidation;

        this.auth.assertThatHasRoleOrAbove(validInput.principal, 'ADMIN');
        const { id } = this.auth.getClaims(validInput.principal);

        const machineImage = await this.virtualizationGateway.getMachineImageById(
            validInput.machineImageId,
        );

        if (!machineImage) {
            throw Errors.resourceNotFound('MachineImage', validInput.machineImageId);
        }

        if (machineImage.platform === 'UNKNOWN') {
            throw Errors.businessRuleViolation('Cannot create a template from an unknown platform');
        }

        const product = await this.virtualizationGateway.getProductByInstancePlatform(
            machineImage.platform,
        );

        const storageInGb = validInput.storageInGb ?? machineImage.storageInGb;

        if (storageInGb < machineImage.storageInGb) {
            throw Errors.businessRuleViolation(
                'StorageInGb cannot be less than the storageInGb of the machine image',
            );
        }

        const instanceTemplate = InstanceTemplate.create({
            createdBy: id,
            name: validInput.name,
            description: validInput.description,
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
