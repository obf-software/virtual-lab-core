import { ProductViewDetail } from '@aws-sdk/client-service-catalog';
import { AwsServiceCatalogIntegration } from '../../integrations/aws-service-catalog/service';
import { GroupService } from '../group/service';

export class ProductService {
    private awsServiceCatalogIntegration: AwsServiceCatalogIntegration;

    private groupService: GroupService;

    constructor(props: {
        awsServiceCatalogIntegration: AwsServiceCatalogIntegration;
        groupService: GroupService;
    }) {
        this.awsServiceCatalogIntegration = props.awsServiceCatalogIntegration;
        this.groupService = props.groupService;
    }

    async listUserProducts(userId: number) {
        const awsPortfolioIds = await this.groupService.listUserGroupAwsPortfolioIds(userId);
        const productIdToDetailMap = new Map<string, ProductViewDetail>([]);

        await Promise.all(
            awsPortfolioIds.map(async (awsPortfolioId) => {
                for await (const batch of this.awsServiceCatalogIntegration.paginateSearchProductsAsAdmin(
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

        console.log(JSON.stringify([...productIdToDetailMap.values()]));

        return [...productIdToDetailMap.values()].map((product) => ({
            awsProductId: product.ProductViewSummary?.ProductId ?? '',
            awsProductViewId: product.ProductViewSummary?.Id ?? '',
            name: product.ProductViewSummary?.Name ?? '',
            description: product.ProductViewSummary?.ShortDescription ?? '',
            createdAt: product.CreatedTime?.toISOString() ?? '',
        }));
    }
}
