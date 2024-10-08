import { z } from 'zod';
import { Logger } from '../../logger';
import { principalSchema } from '../../../domain/dtos/principal';
import { InstanceTemplate } from '../../../domain/entities/instance-template';
import { Auth } from '../../auth';
import { InstanceRepository } from '../../instance-repository';
import { InstanceTemplateRepository } from '../../instance-template-repository';
import { VirtualizationGateway } from '../../virtualization-gateway';
import { Errors } from '../../../domain/dtos/errors';
import { useCaseExecute } from '../../../domain/decorators/use-case-execute';

export const createInstanceTemplateFromInstanceInputSchema = z.object({
    principal: principalSchema,
    instanceId: z.string().min(1),
    name: z.string().min(1),
    description: z.string().min(1),
    storageInGb: z.number().int().min(1).optional(),
});

export type CreateInstanceTemplateFromInstanceInput = z.infer<
    typeof createInstanceTemplateFromInstanceInputSchema
>;

export type CreateInstanceTemplateFromInstanceOutput = InstanceTemplate;

export class CreateInstanceTemplateFromInstance {
    constructor(
        readonly logger: Logger,
        private readonly auth: Auth,
        private readonly instanceRepository: InstanceRepository,
        private readonly instanceTemplateRepository: InstanceTemplateRepository,
        private readonly virtualizationGateway: VirtualizationGateway,
    ) {}

    @useCaseExecute(createInstanceTemplateFromInstanceInputSchema)
    async execute(
        input: CreateInstanceTemplateFromInstanceInput,
    ): Promise<CreateInstanceTemplateFromInstanceOutput> {
        this.auth.assertThatHasRoleOrAbove(input.principal, 'ADMIN');
        const { id } = this.auth.getClaims(input.principal);

        const instance = await this.instanceRepository.getById(input.instanceId);

        if (!instance) {
            throw Errors.resourceNotFound('Instance', input.instanceId);
        }

        const instanceVirtualId = instance.getData().virtualId;
        const instanceStorageInGb = input.storageInGb ?? Number(instance.getData().storageInGb);

        if (!instanceVirtualId) {
            throw Errors.businessRuleViolation(`Instance is not ready to create a template from.`);
        }

        if (instanceStorageInGb < Number(instance.getData().storageInGb)) {
            throw Errors.businessRuleViolation(
                `Storage size must be greater than or equal to the instance's storage size.`,
            );
        }

        const machineImageId = await this.virtualizationGateway.createMachineImage(
            instanceVirtualId,
            instanceStorageInGb,
        );

        const instanceTemplate = InstanceTemplate.create({
            createdBy: id,
            name: input.name,
            description: input.description,
            productId: instance.getData().productId,
            machineImageId,
            platform: instance.getData().platform,
            distribution: instance.getData().distribution,
            storageInGb: instanceStorageInGb,
        });
        instanceTemplate.id = await this.instanceTemplateRepository.save(instanceTemplate);

        return instanceTemplate;
    }
}
