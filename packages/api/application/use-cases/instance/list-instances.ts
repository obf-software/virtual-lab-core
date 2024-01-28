import { z } from 'zod';
import { principalSchema } from '../../../domain/dtos/principal';
import { SeekPaginated, seekPaginationInputSchema } from '../../../domain/dtos/seek-paginated';
import { Instance } from '../../../domain/entities/instance';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { VirtualizationGateway } from '../../virtualization-gateway';
import { InstanceRepository } from '../../instance-repository';
import { Errors } from '../../../domain/dtos/errors';

export const listInstancesInputSchema = z
    .object({
        principal: principalSchema,
        ownerId: z.string().optional(),
        orderBy: z.enum(['creationDate', 'lastConnectionDate', 'name']),
        order: z.enum(['asc', 'desc']),
        pagination: seekPaginationInputSchema,
    })
    .strict();
export type ListInstancesInput = z.infer<typeof listInstancesInputSchema>;

export type ListInstancesOutput = SeekPaginated<Instance>;

export class ListInstances {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly instanceRepository: InstanceRepository,
        private readonly virtualizationGateway: VirtualizationGateway,
    ) {}

    execute = async (input: ListInstancesInput): Promise<ListInstancesOutput> => {
        this.logger.debug('ListInstances.execute', { input });

        const inputValidation = listInstancesInputSchema.safeParse(input);
        if (!inputValidation.success) throw Errors.validationError(inputValidation.error);
        const { data: validInput } = inputValidation;

        this.auth.assertThatHasRoleOrAbove(validInput.principal, 'USER');
        const { id } = this.auth.getClaims(validInput.principal);

        if (
            !this.auth.hasRoleOrAbove(validInput.principal, 'ADMIN') &&
            validInput.ownerId !== undefined &&
            validInput.ownerId !== id
        ) {
            throw Errors.insufficientRole('ADMIN');
        }

        const paginatedInstances = await this.instanceRepository.list(
            {
                ownerId: validInput.ownerId,
            },
            validInput.orderBy,
            validInput.order,
            validInput.pagination,
        );

        const instanceVirtualIdToStateMap = await this.virtualizationGateway.listInstancesStates(
            paginatedInstances.data
                .map((i) => i.getData().virtualId)
                .filter((i): i is string => i !== undefined),
        );

        const instancesWithStates = paginatedInstances.data.map((i) => {
            i.onStateRetrieved(instanceVirtualIdToStateMap[i.getData().virtualId ?? '']);
            return i;
        });

        return {
            ...paginatedInstances,
            data: instancesWithStates,
        };
    };
}
