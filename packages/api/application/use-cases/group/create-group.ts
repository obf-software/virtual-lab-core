import { Principal } from '../../../domain/dtos/principal';
import { Group } from '../../../domain/entities/group';
import { ApplicationError } from '../../../domain/errors/application-error';
import { AuthError } from '../../../domain/errors/auth-error';
import { Auth } from '../../auth';
import { CatalogGateway } from '../../catalog-gateway';
import { Logger } from '../../logger';
import { GroupRepository } from '../../repositories/group-repository';

export interface CreateGroupInput {
    principal: Principal;
    name: string;
    description: string;
    portfolioId: string;
}

export type CreateGroupOutput = Group;

export class CreateGroup {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly groupRepository: GroupRepository,
        private readonly catalogGateway: CatalogGateway,
    ) {}

    execute = async (input: CreateGroupInput): Promise<CreateGroupOutput> => {
        this.logger.debug('CreateGroup.execute', { input });

        this.auth.assertThatHasRoleOrAbove(
            input.principal,
            'ADMIN',
            AuthError.insufficientRole('ADMIN'),
        );

        const portfolioExists = await this.catalogGateway.portfolioExists(input.portfolioId);

        if (!portfolioExists) {
            throw ApplicationError.businessRuleViolation('Portfolio does not exist');
        }

        const newGroup = Group.create(input.name, input.description, input.portfolioId);
        const newGroupId = await this.groupRepository.save(newGroup);
        newGroup.setId(newGroupId);
        return newGroup;
    };
}
