import {
    DescribePortfolioCommand,
    DescribeProductAsAdminCommand,
    DescribeProvisioningParametersCommand,
    ListLaunchPathsCommand,
    ServiceCatalogClient,
    TerminateProvisionedProductCommand,
    paginateSearchProductsAsAdmin,
} from '@aws-sdk/client-service-catalog';
import { randomUUID } from 'node:crypto';

export class ServiceCatalog {
    private client: ServiceCatalogClient;

    constructor(AWS_REGION: string) {
        this.client = new ServiceCatalogClient({ region: AWS_REGION });
    }

    async portfolioExists(portfolioId: string) {
        try {
            const command = new DescribePortfolioCommand({ Id: portfolioId });
            const { PortfolioDetail } = await this.client.send(command);
            return PortfolioDetail !== undefined;
        } catch {
            return false;
        }
    }

    paginateListPortfolioProducts(portfolioId: string) {
        return paginateSearchProductsAsAdmin(
            { client: this.client },
            { PortfolioId: portfolioId, PageSize: 1000 },
        );
    }

    async getProduct(productId: string) {
        const command = new DescribeProductAsAdminCommand({ Id: productId });
        const { ProductViewDetail, ProvisioningArtifactSummaries, Tags } =
            await this.client.send(command);
        return { ProductViewDetail, ProvisioningArtifactSummaries, Tags };
    }

    async terminateProvisionedProductByName(provisionedProductName: string) {
        const command = new TerminateProvisionedProductCommand({
            ProvisionedProductName: provisionedProductName,
            IgnoreErrors: true,
            RetainPhysicalResources: false,
            TerminateToken: randomUUID(),
        });
        await this.client.send(command);
    }

    async getProductLaunchPath(productId: string) {
        const command = new ListLaunchPathsCommand({ ProductId: productId });
        const { LaunchPathSummaries } = await this.client.send(command);
        if (LaunchPathSummaries === undefined || LaunchPathSummaries.length === 0) {
            return undefined;
        }

        return LaunchPathSummaries[0];
    }

    async getProductProvisioningParameters(
        productId: string,
        artifactName: string,
        launchPathId: string,
    ) {
        const command = new DescribeProvisioningParametersCommand({
            ProductId: productId,
            ProvisioningArtifactName: artifactName,
            PathId: launchPathId,
        });
        const { ProvisioningArtifactParameters } = await this.client.send(command);
        return ProvisioningArtifactParameters;
    }
}
