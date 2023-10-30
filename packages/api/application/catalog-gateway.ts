import { InstanceConnectionType } from '../domain/dtos/instance-connection-type';

export interface ProductProvisioningParameter {
    key: string;
    label: string;
    hidden: boolean;
    allowedValues?: string[];
    defaultValue?: string;
}

export interface Product {
    id: string;
    name: string;
    description: string;
}

export interface ProvisionedProduct {
    instanceId: string;
    connectionType: InstanceConnectionType;
    provisionToken: string;
}

export interface Portfolio {
    id: string;
    name: string;
    description: string;
}

/**
 * CatalogGateway is an interface that abstracts the management of templates.
 * A template is a product that can be provisioned by the user.
 */
export interface CatalogGateway {
    portfolioExists(portfolioId: string): Promise<boolean>;
    listPortfolios(): Promise<Portfolio[]>;
    listPortfolioProducts(portfolioId: string): Promise<Product[]>;
    getProductById(productId: string): Promise<Product>;
    getProductProvisioningParameters(productId: string): Promise<ProductProvisioningParameter[]>;
    provisionProduct(productId: string, parameters: Record<string, string>): Promise<string>;
    terminateProvisionedProductByProvisionToken(provisionToken: string): Promise<void>;
    getProvisionedProductByStackName(stackName: string): Promise<ProvisionedProduct>;
}
