import { z } from 'zod';
import { Logger } from '../../logger';
import { Auth } from '../../auth';
import { VirtualizationGateway } from '../../virtualization-gateway';
import { Product } from '../../../domain/dtos/product';
import { principalSchema } from '../../../domain/dtos/principal';
import { Errors } from '../../../domain/dtos/errors';

export const listProductsInputSchema = z.object({
    principal: principalSchema,
});

export type ListProductsInput = z.infer<typeof listProductsInputSchema>;

export type ListProductsOutput = Product[];

export class ListProducts {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly virtualizationGateway: VirtualizationGateway,
    ) {}

    async execute(input: ListProductsInput): Promise<ListProductsOutput> {
        this.logger.debug('ListProducts.execute', { input });

        const inputValidation = listProductsInputSchema.safeParse(input);
        if (!inputValidation.success) throw Errors.validationError(inputValidation.error);
        const { data: validInput } = inputValidation;

        this.auth.assertThatHasRoleOrAbove(validInput.principal, 'ADMIN');

        const products = await this.virtualizationGateway.listProducts();
        return products;
    }
}
