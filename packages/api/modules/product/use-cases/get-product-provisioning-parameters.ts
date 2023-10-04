import createHttpError from 'http-errors';
import { IUseCase } from '../../../domain/interfaces';
import { Principal } from '../../../infrastructure/auth/protocols';
import { throwIfInsufficientRole } from '../../../infrastructure/auth/throw-if-insufficient-role';
import { ServiceCatalog } from '../../../infrastructure/aws/service-catalog';

export class GetProductProvisioningParametersUseCase implements IUseCase {
    constructor(private readonly serviceCatalog: ServiceCatalog) {}

    execute = async (props: { principal: Principal; awsProductId: string }) => {
        throwIfInsufficientRole('USER', props.principal.role);

        const launchPath = await this.serviceCatalog.getProductLaunchPath(props.awsProductId);

        if (!launchPath?.Id) {
            throw new createHttpError.NotFound('Product launch path not found');
        }

        const provisioningParameters = await this.serviceCatalog.getProductProvisioningParameters(
            props.awsProductId,
            'latest',
            launchPath.Id,
        );

        if (!provisioningParameters) {
            throw new createHttpError.NotFound('Product provisioning parameters not found');
        }

        return {
            provisioningParameters: provisioningParameters,
            launchPathId: launchPath.Id,
        };
    };
}
