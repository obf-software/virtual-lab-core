import { z } from 'zod';
import { principalSchema } from '../../../domain/dtos/principal';
import { SeekPaginated, seekPaginationInputSchema } from '../../../domain/dtos/seek-paginated';
import { Instance } from '../../../domain/entities/instance';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { VirtualizationGateway } from '../../virtualization-gateway';
import { InstanceRepository } from '../../instance-repository';
import { Errors } from '../../../domain/dtos/errors';
import { useCaseExecute } from '../../../domain/decorators/use-case-execute';

export const listInstancesInputSchema = z
    .object({
        principal: principalSchema,
        textSearch: z.string().min(1).optional(),
        ownerId: z.string().min(1).optional(),
        orderBy: z.enum(['creationDate', 'lastConnectionDate', 'alphabetical']),
        order: z.enum(['asc', 'desc']),
        pagination: seekPaginationInputSchema,
    })
    .strict();
export type ListInstancesInput = z.infer<typeof listInstancesInputSchema>;

export type ListInstancesOutput = SeekPaginated<Instance>;

export class ListInstances {
    constructor(
        readonly logger: Logger,
        private readonly auth: Auth,
        private readonly instanceRepository: InstanceRepository,
        private readonly virtualizationGateway: VirtualizationGateway,
    ) {}

    @useCaseExecute(listInstancesInputSchema)
    async execute(input: ListInstancesInput): Promise<ListInstancesOutput> {
        this.auth.assertThatHasRoleOrAbove(input.principal, 'USER');
        const { id } = this.auth.getClaims(input.principal);

        const ownerId = input.ownerId === 'me' ? id : input.ownerId;

        if (!this.auth.hasRoleOrAbove(input.principal, 'ADMIN') && ownerId !== id) {
            throw Errors.insufficientRole('ADMIN');
        }

        const paginatedInstances = await this.instanceRepository.list(
            {
                ownerId,
                textSearch: input.textSearch,
            },
            input.orderBy,
            input.order,
            input.pagination,
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
    }
}
