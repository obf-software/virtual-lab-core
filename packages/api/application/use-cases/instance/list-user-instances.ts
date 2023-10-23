import { Principal } from '../../../domain/dtos/principal';
import { SeekPaginated } from '../../../domain/dtos/seek-paginated';
import { SeekPaginationInput } from '../../../domain/dtos/seek-pagination-input';
import { Instance } from '../../../domain/entities/instance';
import { AuthError } from '../../../domain/errors/auth-error';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { InstanceRepository } from '../../repositories/instance-repository';
import { VirtualizationGateway } from '../../virtualization-gateway';

export interface ListUserInstancesInput {
    principal: Principal;
    userId?: number;
    pagination: SeekPaginationInput;
}

export type ListUserInstancesOutput = SeekPaginated<Instance>;

export class ListUserInstances {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly instanceRepository: InstanceRepository,
        private readonly virtualizationGateway: VirtualizationGateway,
    ) {}

    execute = async (input: ListUserInstancesInput): Promise<ListUserInstancesOutput> => {
        this.logger.debug('ListUserInstances.execute', { input });

        this.auth.assertThatHasRoleOrAbove(
            input.principal,
            'USER',
            AuthError.insufficientRole('USER'),
        );

        const principalId = this.auth.getId(input.principal);
        const userId = input.userId ?? principalId;

        if (!this.auth.hasRoleOrAbove(input.principal, 'ADMIN') && userId !== principalId) {
            throw AuthError.insufficientRole('ADMIN');
        }

        const paginatedInstances = await this.instanceRepository.listByUser(
            userId,
            input.pagination,
        );
        const instanceLogicalIds = paginatedInstances.data
            .filter((i) => i.getData().logicalId !== null)
            .map((i) => i.getData().logicalId!);

        const instanceStatesByLogicalId =
            await this.virtualizationGateway.listInstanceStates(instanceLogicalIds);

        const instancesWithStates = paginatedInstances.data.map((i) => {
            i.setState(instanceStatesByLogicalId[i.getData().logicalId ?? '']);
            return i;
        });

        return {
            ...paginatedInstances,
            data: instancesWithStates,
        };
    };

    // execute = async (props: {
    //     principal: Principal;
    //     userId?: string;
    //     pagination: { resultsPerPage: number; page: number };
    // }) => {
    //     throwIfInsufficientRole('USER', props.principal.role);

    //     const userIdAsNumber = Number(props.userId);
    //     let userIdToUse = props.principal.userId;

    //     if (hasRoleOrAbove('ADMIN', props.principal.role) && props.userId !== 'me') {
    //         if (Number.isNaN(userIdAsNumber)) {
    //             throw new createHttpError.NotFound('User not found');
    //         }

    //         userIdToUse = userIdAsNumber;
    //     }

    //     const paginatedInstances = await this.instanceRepository.listByUser(
    //         userIdToUse,
    //         props.pagination,
    //     );

    //     if (paginatedInstances.data.length === 0) {
    //         return paginatedInstances;
    //     }

    //     const awsInstanceIds: string[] = paginatedInstances.data
    //         .filter((i) => i.awsInstanceId !== null)
    //         .map((i) => i.awsInstanceId!);

    //     const instanceStatuses =
    //         awsInstanceIds.length > 0 ? await this.ec2.listInstanceStatuses(awsInstanceIds) : [];
    //     const instanceStatesByInstanceId = instanceStatuses.reduce(
    //         (acc, curr) => {
    //             if (curr.InstanceId !== undefined) {
    //                 acc[curr.InstanceId] = curr.InstanceState?.Name;
    //             }
    //             return acc;
    //         },
    //         {} as Record<string, string | undefined>,
    //     );

    //     const instancesWithStates = paginatedInstances.data.map((i) => ({
    //         ...i,
    //         state: instanceStatesByInstanceId[i.awsInstanceId ?? ''],
    //     }));

    //     return {
    //         ...paginatedInstances,
    //         data: instancesWithStates,
    //     };
    // };
}
