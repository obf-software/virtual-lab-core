import { Principal } from '../../../domain/dtos/principal';
import { AuthError } from '../../../domain/errors/auth-error';
import { Auth } from '../../auth';
import { CatalogGateway, ProductProvisioningParameter } from '../../catalog-gateway';
import { Logger } from '../../logger';

export interface GetProductProvisioningParametersInput {
    principal: Principal;
    productId: string;
}

export type GetProductProvisioningParametersOutput = ProductProvisioningParameter[];

export class GetProductProvisioningParameters {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly catalogGateway: CatalogGateway,
    ) {}

    execute = async (
        input: GetProductProvisioningParametersInput,
    ): Promise<GetProductProvisioningParametersOutput> => {
        this.logger.debug('GetProductProvisioningParameters.execute', { input });

        this.auth.assertThatHasRoleOrAbove(
            input.principal,
            'USER',
            AuthError.insufficientRole('USER'),
        );

        return await this.catalogGateway.getProductProvisioningParameters(input.productId);
    };
}

// const launchPath = await this.serviceCatalog.getProductLaunchPath(props.awsProductId);
// if (!launchPath?.Id) {
//     throw new createHttpError.NotFound('Product launch path not found');
// }
// const provisioningParameters = await this.serviceCatalog.getProductProvisioningParameters(
//     props.awsProductId,
//     'latest',
//     launchPath.Id,
// );
// if (!provisioningParameters) {
//     throw new createHttpError.NotFound('Product provisioning parameters not found');
// }
// return {
//     provisioningParameters: provisioningParameters,
//     launchPathId: launchPath.Id,
// };
