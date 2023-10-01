import { ProductProvisioningParameter, Product } from '../../services/api/protocols';

export interface ProductsContextData {
    loadProducts: () => Promise<void>;
    loadProductProvisioningParameters: (
        awsProductId: string,
    ) => Promise<ProductProvisioningParameter[]>;
    isLoading: boolean;
    products: {
        data: Product;
        provisioningParameters?: ProductProvisioningParameter[];
    }[];
}
