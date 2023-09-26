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
                for await (const batch of this.awsServiceCatalogIntegration.paginateListPortfolioProducts(
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

        return await Promise.all(
            [...productIdToDetailMap.values()].map(async (product) => {
                const productData = await this.awsServiceCatalogIntegration.getProduct(
                    product.ProductViewSummary?.ProductId ?? '',
                );

                const artifactsSortedByCreationTime =
                    productData.ProvisioningArtifactSummaries?.sort((a, b) => {
                        const aDate = new Date(a.CreatedTime ?? '');
                        const bDate = new Date(b.CreatedTime ?? '');
                        return bDate.getTime() - aDate.getTime();
                    }) ?? [];

                return {
                    awsProductId: product.ProductViewSummary?.ProductId ?? '',
                    awsProductViewId: product.ProductViewSummary?.Id ?? '',
                    awsProductArtifactId: artifactsSortedByCreationTime[0]?.Id ?? '',
                    name: product.ProductViewSummary?.Name ?? '',
                    description: product.ProductViewSummary?.ShortDescription ?? '',
                    createdAt: product.CreatedTime?.toISOString() ?? '',
                    tags: productData.Tags?.map((tag) => tag.Value).join(', ') ?? null,
                };
            }),
        );
    }
}
