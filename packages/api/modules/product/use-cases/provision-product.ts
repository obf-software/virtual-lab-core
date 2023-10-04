import createHttpError from 'http-errors';
import { IUseCase } from '../../../domain/interfaces';
import { hasRoleOrAbove } from '../../../infrastructure/auth/has-role-or-above';
import { Principal } from '../../../infrastructure/auth/protocols';
import { throwIfInsufficientRole } from '../../../infrastructure/auth/throw-if-insufficient-role';
import { ServiceCatalog } from '../../../infrastructure/aws/service-catalog';
import { InstanceRepository, QuotaRepository } from '../../../infrastructure/repositories';

export class ProvisionProductUseCase implements IUseCase {
    constructor(
        private readonly quotaRepository: QuotaRepository,
        private readonly instanceRepository: InstanceRepository,
        private readonly serviceCatalog: ServiceCatalog,
    ) {}

    execute = async (props: {
        principal: Principal;
        userId?: string;
        productId: string;
        launchPathId: string;
        provisionParameters: { key: string; value: string }[];
    }) => {
        throwIfInsufficientRole('USER', props.principal.role);

        const [quota, userInstancesCount] = await Promise.all([
            this.quotaRepository.getByUserId(props.principal.userId),
            this.instanceRepository.countByUser(props.principal.userId),
        ]);

        if (!quota) {
            throw new createHttpError.InternalServerError('Quota not found');
        }

        const userIdAsNumber = Number(props.userId);
        let userIdToUse = props.principal.userId;

        if (hasRoleOrAbove('ADMIN', props.principal.role) && props.userId !== 'me') {
            if (Number.isNaN(userIdAsNumber)) {
                throw new createHttpError.NotFound('User not found');
            }

            userIdToUse = userIdAsNumber;
        }

        if (
            !hasRoleOrAbove('ADMIN', props.principal.role) &&
            userInstancesCount >= quota.maxInstances
        ) {
            throw new createHttpError.Forbidden('Max instances reached');
        }

        const [{ provisionedProductName }, product] = await Promise.all([
            this.serviceCatalog.provisionProduct({
                productId: props.productId,
                launchPathId: props.launchPathId,
                provisioningParameters: props.provisionParameters.map((param) => ({
                    Key: param.key,
                    Value: param.value,
                })),
            }),
            this.serviceCatalog.getProduct(props.productId),
        ]);

        const instance = await this.instanceRepository.create({
            name: product.ProductViewDetail?.ProductViewSummary?.Name ?? 'No name',
            description: product.ProductViewDetail?.ProductViewSummary?.Name ?? 'No description',
            awsProvisionedProductName: provisionedProductName,
            userId: userIdToUse,
        });

        if (!instance) {
            throw new createHttpError.BadRequest('Invalid instance data');
        }

        return instance;
    };
}
