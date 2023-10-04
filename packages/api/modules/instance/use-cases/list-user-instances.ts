import createHttpError from 'http-errors';
import { Principal } from '../../../infrastructure/auth/protocols';
import { throwIfInsufficientRole } from '../../../infrastructure/auth/throw-if-insufficient-role';
import { InstanceRepository } from '../../../infrastructure/repositories';
import { hasRoleOrAbove } from '../../../infrastructure/auth/has-role-or-above';
import { IUseCase } from '../../../domain/interfaces';
import { EC2 } from '../../../infrastructure/aws/ec2';

export class ListUserInstancesUseCase implements IUseCase {
    constructor(
        private readonly instanceRepository: InstanceRepository,
        private readonly ec2: EC2,
    ) {}

    execute = async (props: {
        principal: Principal;
        userId?: string;
        pagination: { resultsPerPage: number; page: number };
    }) => {
        throwIfInsufficientRole('USER', props.principal.role);

        const userIdAsNumber = Number(props.userId);
        let userIdToUse = props.principal.userId;

        if (hasRoleOrAbove('ADMIN', props.principal.role) && props.userId !== 'me') {
            if (Number.isNaN(userIdAsNumber)) {
                throw new createHttpError.NotFound('User not found');
            }

            userIdToUse = userIdAsNumber;
        }

        const paginatedInstances = await this.instanceRepository.listByUser(
            userIdToUse,
            props.pagination,
        );

        if (paginatedInstances.data.length === 0) {
            return paginatedInstances;
        }

        const awsInstanceIds: string[] = paginatedInstances.data
            .filter((i) => i.awsInstanceId !== null)
            .map((i) => i.awsInstanceId!);

        const instanceStatuses =
            awsInstanceIds.length > 0 ? await this.ec2.listInstanceStatuses(awsInstanceIds) : [];
        const instanceStatesByInstanceId = instanceStatuses.reduce(
            (acc, curr) => {
                if (curr.InstanceId !== undefined) {
                    acc[curr.InstanceId] = curr.InstanceState?.Name;
                }
                return acc;
            },
            {} as Record<string, string | undefined>,
        );

        const instancesWithStates = paginatedInstances.data.map((i) => ({
            ...i,
            state: instanceStatesByInstanceId[i.awsInstanceId ?? ''],
        }));

        return {
            ...paginatedInstances,
            data: instancesWithStates,
        };
    };
}
