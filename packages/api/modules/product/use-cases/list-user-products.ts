import { IUseCase } from '../../../domain/interfaces';
import { throwIfInsufficientRole } from '../../../infrastructure/auth/throw-if-insufficient-role';
import { Principal } from '../../../infrastructure/auth/protocols';
import { hasRoleOrAbove } from '../../../infrastructure/auth/has-role-or-above';
import createHttpError from 'http-errors';
import { GroupRepository } from '../../../infrastructure/repositories';
import { ServiceCatalog } from '../../../infrastructure/aws/service-catalog';
import { ProductViewDetail } from '@aws-sdk/client-service-catalog';

export class ListUserProductsUseCase implements IUseCase {
    constructor(
        private readonly groupRepository: GroupRepository,
        private readonly serviceCatalog: ServiceCatalog,
    ) {}

    execute = async (props: { principal: Principal; userId?: string }) => {
        throwIfInsufficientRole('USER', props.principal.role);

        const userIdAsNumber = Number(props.userId);
        let userIdToUse = props.principal.userId;

        if (hasRoleOrAbove('ADMIN', props.principal.role) && props.userId !== 'me') {
            if (Number.isNaN(userIdAsNumber)) {
                throw new createHttpError.NotFound('User not found');
            }

            userIdToUse = userIdAsNumber;
        }

        const awsPortfolioIds = await this.groupRepository.listAwsPortfolioIdsByUser(userIdToUse);
        const productIdToDetailMap = new Map<string, ProductViewDetail>([]);

        await Promise.all(
            awsPortfolioIds.map(async (awsPortfolioId) => {
                for await (const batch of this.serviceCatalog.paginateListPortfolioProducts(
                    awsPortfolioId,
                )) {
                    for (const product of batch.ProductViewDetails ?? []) {
                        const productId = product.ProductViewSummary?.ProductId;

                        if (productId !== undefined && !productIdToDetailMap.has(productId)) {
                            productIdToDetailMap.set(productId, product);
                        }
                    }
                }
            }),
        );

        return [...productIdToDetailMap.values()].map((product) => ({
            awsProductId: product.ProductViewSummary?.ProductId ?? '',
            awsProductViewId: product.ProductViewSummary?.Id ?? '',
            name: product.ProductViewSummary?.Name ?? '',
            description: product.ProductViewSummary?.ShortDescription ?? '',
            createdAt: product.CreatedTime?.toISOString() ?? '',
        }));
    };
}
