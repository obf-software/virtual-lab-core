import {
    DescribePortfolioCommand,
    ServiceCatalogClient,
    paginateSearchProductsAsAdmin,
} from '@aws-sdk/client-service-catalog';

export class AwsServiceCatalogIntegration {
    private client: ServiceCatalogClient;

    constructor(props: { AWS_REGION: string }) {
        this.client = new ServiceCatalogClient({ region: props.AWS_REGION });
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

    paginateSearchProductsAsAdmin(portfolioId: string) {
        return paginateSearchProductsAsAdmin({ client: this.client }, { PortfolioId: portfolioId });
    }
}
