import { ProductProvisioningParameters, ProductSummary } from '../../services/api/protocols';

export interface ProductsContextData {
    loadProducts: () => Promise<void>;
    loadProductProvisioningParameters: (awsProductId: string) => Promise<void>;
    isLoading: boolean;
    products: {
        summary: ProductSummary;
        provisioningParameters?: ProductProvisioningParameters;
        isLoading: boolean;
    }[];
}
