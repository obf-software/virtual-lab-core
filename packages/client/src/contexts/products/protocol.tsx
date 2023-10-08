import { ProductProvisioningParameter, Product } from '../../services/api/protocols';

export interface ProductsContextData {
    loadProducts: () => Promise<void>;
    loadProductProvisioningParameters: (awsProductId: string) => Promise<{
        provisioningParameters: ProductProvisioningParameter[];
        launchPathId: string;
    }>;
    isLoading: boolean;
    products: {
        data: Product;
        launchPathId?: string;
        provisioningParameters?: ProductProvisioningParameter[];
    }[];
}
