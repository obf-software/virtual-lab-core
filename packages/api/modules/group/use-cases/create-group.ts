import createHttpError from 'http-errors';
import { IUseCase } from '../../../domain/interfaces';
import { Principal } from '../../../infrastructure/auth/protocols';
import { ServiceCatalog } from '../../../infrastructure/aws/service-catalog';
import { GroupRepository } from '../../../infrastructure/repositories';
import { throwIfInsufficientRole } from '../../../infrastructure/auth/throw-if-insufficient-role';

export class CreateGroupUseCase implements IUseCase {
    private groupRepository: GroupRepository;
    private serviceCatalog: ServiceCatalog;

    constructor(deps: { groupRepository: GroupRepository; serviceCatalog: ServiceCatalog }) {
        this.groupRepository = deps.groupRepository;
        this.serviceCatalog = deps.serviceCatalog;
    }

    execute = async (props: {
        principal: Principal;
        name: string;
        description: string;
        awsPortfolioId: string;
    }) => {
        throwIfInsufficientRole('ADMIN', props.principal.role);

        const portfilioExists = await this.serviceCatalog.portfolioExists(props.awsPortfolioId);

        if (!portfilioExists) {
            throw new createHttpError.BadRequest('Invalid AWS Portfolio ID');
        }

        const group = await this.groupRepository.create({
            name: props.name,
            description: props.description,
            awsPortfolioId: props.awsPortfolioId,
        });

        if (!group) {
            throw new createHttpError.InternalServerError('Failed to create group');
        }

        return group;
    };
}
