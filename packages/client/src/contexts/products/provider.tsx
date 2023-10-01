import React from 'react';
import { ProductsContext } from './context';
import { useToast } from '@chakra-ui/react';
import { listUserProducts, getProductProvisioningParameters } from '../../services/api/service';
import { ProductsContextData } from './protocol';

export const ProductsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const [products, setProducts] = React.useState<ProductsContextData['products']>([]);
    const toast = useToast();

    const loadProducts: ProductsContextData['loadProducts'] = async () => {
        setIsLoading(true);
        const { data, error } = await listUserProducts(undefined);

        if (error !== undefined) {
            setIsLoading(false);
            toast({
                colorScheme: 'red',
                title: 'Erro ao listar produtos',
                description: error,
                isClosable: true,
                duration: 5000,
                status: 'error',
                variant: 'left-accent',
                position: 'bottom-left',
            });
            return;
        }

        setIsLoading(false);
        setProducts(
            data.map((data) => ({
                data,
                provisioningParameters: undefined,
                isLoading: false,
            })),
        );
    };

    const loadProductProvisioningParameters: ProductsContextData['loadProductProvisioningParameters'] =
        async (awsProductId) => {
            const product = products.find((product) => product.data.awsProductId === awsProductId);

            if (product?.provisioningParameters !== undefined) {
                return product.provisioningParameters;
            }

            const { data, error } = await getProductProvisioningParameters(awsProductId);

            if (error !== undefined) {
                throw new Error(error);
            }

            setProducts((currentProducts) => {
                return currentProducts.map((currentProduct) => {
                    if (currentProduct.data.awsProductId === awsProductId) {
                        return {
                            ...currentProduct,
                            provisioningParameters: data,
                        };
                    }
                    return currentProduct;
                });
            });

            return data;
        };

    return (
        <ProductsContext.Provider
            value={{
                loadProducts,
                loadProductProvisioningParameters,
                products,
                isLoading,
            }}
        >
            {children}
        </ProductsContext.Provider>
    );
};
