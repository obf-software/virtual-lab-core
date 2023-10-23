import { Principal } from '../../../domain/dtos/principal';
import { Instance } from '../../../domain/entities/instance';
import { ApplicationError } from '../../../domain/errors/application-error';
import { AuthError } from '../../../domain/errors/auth-error';
import { Auth } from '../../auth';
import { CatalogGateway } from '../../catalog-gateway';
import { Logger } from '../../logger';
import { InstanceRepository } from '../../repositories/instance-repository';
import { UserRepository } from '../../repositories/user-repository';

export interface ProvisionProductInput {
    principal: Principal;
    userId?: number;
    productId: string;
    parameters: Record<string, string>;
}

export type ProvisionProductOutput = Instance;

export class ProvisionProduct {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly userRepository: UserRepository,
        private readonly instanceRepository: InstanceRepository,
        private readonly catalogGateway: CatalogGateway,
    ) {}

    execute = async (input: ProvisionProductInput): Promise<ProvisionProductOutput> => {
        this.logger.debug('ProvisionProduct.execute', { input });

        this.auth.assertThatHasRoleOrAbove(
            input.principal,
            'USER',
            AuthError.insufficientRole('USER'),
        );

        const principalId = this.auth.getId(input.principal);
        const userId = input.userId ?? principalId;

        const user = await this.userRepository.getById(userId);
        if (!user) throw ApplicationError.resourceNotFound();

        if (!this.auth.hasRoleOrAbove(input.principal, 'ADMIN')) {
            if (userId !== principalId) {
                throw AuthError.insufficientRole('ADMIN');
            }

            const maxInstances = user.getData().maxInstances;
            const instancesCount = await this.instanceRepository.countByUser(userId);

            if (instancesCount >= maxInstances) {
                throw ApplicationError.businessRuleViolation('Max instances reached');
            }
        }

        const [provisionedProductId, product] = await Promise.all([
            this.catalogGateway.provisionProduct(input.productId, input.parameters),
            this.catalogGateway.getProductById(input.productId),
        ]);

        const instance = Instance.create(
            product.name,
            product.description,
            userId,
            provisionedProductId,
        );
        const instanceId = await this.instanceRepository.save(instance);
        instance.setId(instanceId);
        return instance;
    };
}
