import { IUseCase } from '../../../domain/interfaces';
import { Principal } from '../../../infrastructure/auth/protocols';
import { throwIfInsufficientRole } from '../../../infrastructure/auth/throw-if-insufficient-role';
import { UserRepository } from '../../../infrastructure/repositories';

export class ListUsersUseCase implements IUseCase {
    constructor(private readonly userRepository: UserRepository) {}

    execute = async (props: {
        principal: Principal;
        pagination: { resultsPerPage: number; page: number };
    }) => {
        throwIfInsufficientRole('ADMIN', props.principal.role);
        console.log('props', props);
        return await this.userRepository.list(props.pagination);
    };
}
