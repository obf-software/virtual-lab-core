import {
    DescribePortfolioCommand,
    DescribeProductAsAdminCommand,
    DescribeProvisioningParametersCommand,
    ListLaunchPathsCommand,
    ProvisionProductCommand,
    ServiceCatalogClient,
    TerminateProvisionedProductCommand,
    paginateListPortfolios,
    paginateSearchProductsAsAdmin,
} from '@aws-sdk/client-service-catalog';
import {
    CatalogGateway,
    Portfolio,
    Product,
    ProductProvisioningParameter,
    ProvisionedProduct,
} from '../application/catalog-gateway';
import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import { randomUUID } from 'node:crypto';
import createHttpError from 'http-errors';
import { InstanceConnectionType } from '../domain/dtos/instance-connection-type';

export class AwsCatalogGateway implements CatalogGateway {
    private scClient: ServiceCatalogClient;
    private cfClient: CloudFormationClient;

    constructor(
        AWS_REGION: string,
        private readonly SERVICE_CATALOG_NOTIFICATION_ARN: string,
    ) {
        this.scClient = new ServiceCatalogClient({ region: AWS_REGION });
        this.cfClient = new CloudFormationClient({ region: AWS_REGION });
    }

    private getProductLaunchPathId = async (productId: string): Promise<string> => {
        const { LaunchPathSummaries } = await this.scClient.send(
            new ListLaunchPathsCommand({ ProductId: productId }),
        );
        return LaunchPathSummaries?.[0].Id ?? '';
    };

    portfolioExists = async (portfolioId: string): Promise<boolean> => {
        try {
            const { PortfolioDetail } = await this.scClient.send(
                new DescribePortfolioCommand({ Id: portfolioId }),
            );

            return PortfolioDetail !== undefined;
        } catch {
            return false;
        }
    };

    listPortfolios = async (): Promise<Portfolio[]> => {
        const portfolios: Portfolio[] = [];
        const paginator = paginateListPortfolios({ client: this.scClient }, { PageSize: 100 });
        for await (const page of paginator) {
            portfolios.push(
                ...(page.PortfolioDetails ?? []).map((p) => ({
                    id: p.Id ?? '',
                    name: p.DisplayName ?? '',
                    description: p.Description ?? '',
                })),
            );
        }
        return portfolios;
    };

    listPortfolioProducts = async (portfolioId: string): Promise<Product[]> => {
        const products: Product[] = [];
        const paginator = paginateSearchProductsAsAdmin(
            { client: this.scClient },
            { PortfolioId: portfolioId, PageSize: 100 },
        );
        for await (const page of paginator) {
            products.push(
                ...(page.ProductViewDetails ?? []).map((p) => ({
                    id: p.ProductViewSummary?.ProductId ?? '',
                    name: p.ProductViewSummary?.Name ?? '',
                    description: p.ProductViewSummary?.ShortDescription ?? '',
                })),
            );
        }
        return products;
    };

    getProductById = async (productId: string): Promise<Product> => {
        const { ProductViewDetail } = await this.scClient.send(
            new DescribeProductAsAdminCommand({ Id: productId }),
        );
        return {
            id: ProductViewDetail?.ProductViewSummary?.ProductId ?? '',
            name: ProductViewDetail?.ProductViewSummary?.Name ?? '',
            description: ProductViewDetail?.ProductViewSummary?.ShortDescription ?? '',
        };
    };

    getProductProvisioningParameters = async (
        productId: string,
    ): Promise<ProductProvisioningParameter[]> => {
        const { ProvisioningArtifactParameters } = await this.scClient.send(
            new DescribeProvisioningParametersCommand({
                ProductId: productId,
                ProvisioningArtifactName: 'latest',
                PathId: await this.getProductLaunchPathId(productId),
            }),
        );

        return (
            ProvisioningArtifactParameters?.map((p) => ({
                key: p.ParameterKey ?? '',
                label: p.Description ?? p.ParameterKey ?? 'Unknown',
                allowedValues: p.ParameterConstraints?.AllowedValues,
                defaultValue: p.DefaultValue,
            })) ?? []
        );
    };

    provisionProduct = async (
        productId: string,
        parameters: Record<string, string>,
    ): Promise<string> => {
        const provisionToken = randomUUID();

        await this.scClient.send(
            new ProvisionProductCommand({
                ProductId: productId,
                PathId: await this.getProductLaunchPathId(productId),
                ProvisioningArtifactName: 'latest',
                ProvisionedProductName: provisionToken,
                ProvisionToken: provisionToken,
                NotificationArns: [this.SERVICE_CATALOG_NOTIFICATION_ARN],
                ProvisioningParameters: Object.entries(parameters).map(([key, value]) => ({
                    Key: key,
                    Value: value,
                })),
                Tags: [{ Key: 'provisionToken', Value: provisionToken }],
            }),
        );

        return provisionToken;
    };

    terminateProvisionedProductById = async (provisionedProductId: string): Promise<void> => {
        await this.scClient.send(
            new TerminateProvisionedProductCommand({
                ProvisionedProductId: provisionedProductId,
                TerminateToken: provisionedProductId,
                IgnoreErrors: true,
            }),
        );
    };

    getProvisionedProductByStackName = async (stackName: string): Promise<ProvisionedProduct> => {
        const { Stacks } = await this.cfClient.send(
            new DescribeStacksCommand({ StackName: stackName }),
        );
        const stack = Stacks !== undefined && Stacks.length > 0 ? Stacks[0] : undefined;
        if (!stack) throw new createHttpError.InternalServerError(`Stack ${stackName} not found`);

        const { provisionToken } = (stack.Tags?.reduce((acc, tag) => {
            if (tag.Key !== undefined) return { ...acc, [tag.Key]: tag.Value };
            return acc;
        }, {}) ?? {}) as { provisionToken?: string };

        const { connectionType, instanceId } = stack.Outputs?.reduce((acc, output) => {
            if (output.Description !== undefined)
                return { ...acc, [output.Description]: output.OutputValue };
            return acc;
        }, {}) as { connectionType?: string; instanceId?: string };

        if (!provisionToken || !connectionType || !instanceId) {
            throw new createHttpError.InternalServerError(
                `Stack ${stackName} does not have the required information`,
            );
        }

        return {
            connectionType:
                InstanceConnectionType[connectionType as keyof typeof InstanceConnectionType],
            instanceId,
            provisionToken,
        };
    };
}
