import { ProductProvisioningParameters, Product } from '../../services/api/protocols';

export interface ProductsContextData {
    loadProducts: () => Promise<void>;
    loadProductProvisioningParameters: (awsProductId: string) => Promise<void>;
    isLoading: boolean;
    products: {
        data: Product;
        provisioningParameters?: ProductProvisioningParameters;
        isLoading: boolean;
    }[];
}
