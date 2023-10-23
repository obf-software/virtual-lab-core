import { Principal } from '../../../domain/dtos/principal';
import { AuthError } from '../../../domain/errors/auth-error';
import { Auth } from '../../auth';
import { CatalogGateway, Product } from '../../catalog-gateway';
import { Logger } from '../../logger';
import { GroupRepository } from '../../repositories/group-repository';

export interface ListUserProductsInput {
    principal: Principal;
    userId?: number;
}

export type ListUserProductsOutput = Product[];

export class ListUserProducts {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly groupRepository: GroupRepository,
        private readonly catalogGateway: CatalogGateway,
    ) {}

    execute = async (input: ListUserProductsInput): Promise<ListUserProductsOutput> => {
        this.logger.debug('ListUserProducts.execute', { input });

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

        const portfolioIds = await this.groupRepository.listGroupPortfolioIdsByUser(userId);
        const idToProductMap = new Map<string, Product>([]);

        await Promise.all(
            portfolioIds.map(async (portfolioId) => {
                const products = await this.catalogGateway.listPortfolioProducts(portfolioId);

                products.forEach((product) => {
                    idToProductMap.set(product.id, product);
                });
            }),
        );

        return [...idToProductMap.values()];
    };
}
