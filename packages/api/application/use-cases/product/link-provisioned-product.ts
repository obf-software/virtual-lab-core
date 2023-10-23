import { CatalogGateway } from '../../catalog-gateway';
import { Logger } from '../../logger';
import { NotificationPublisher } from '../../notification-publisher';
import { InstanceRepository } from '../../repositories/instance-repository';
import { UserRepository } from '../../repositories/user-repository';
import { VirtualizationGateway } from '../../virtualization-gateway';
import { ApplicationError } from '../../../domain/errors/application-error';
import { InstanceProvisionedNotification } from '../../../domain/notifications/instance-provisioned-notification';

export interface LinkProvisionedProductInput {
    provisionedProductStackName: string;
}

export type LinkProvisionedProductOutput = void;

export class LinkProvisionedProduct {
    constructor(
        private readonly logger: Logger,
        private readonly userRepository: UserRepository,
        private readonly instanceRepository: InstanceRepository,
        private readonly virtualizationGateway: VirtualizationGateway,
        private readonly catalogGateway: CatalogGateway,
        private readonly notificationPublisher: NotificationPublisher,
    ) {}

    execute = async (input: LinkProvisionedProductInput): Promise<LinkProvisionedProductOutput> => {
        this.logger.debug('LinkProvisionedProduct.execute', { input });

        const provisionedProduct = await this.catalogGateway.getProvisionedProductByStackName(
            input.provisionedProductStackName,
        );

        const [virtualInstance, instance] = await Promise.all([
            this.virtualizationGateway.getInstanceDetailedInfoById(provisionedProduct.instanceId),
            this.instanceRepository.getByProvisionToken(provisionedProduct.provisionToken),
        ]);

        if (!instance) throw ApplicationError.resourceNotFound();

        instance.onProvisioned({
            connectionType: provisionedProduct.connectionType,
            logicalId: virtualInstance.id,
            cpuCores: virtualInstance.cpuCores,
            distribution: virtualInstance.distribution,
            instanceType: virtualInstance.instanceType,
            memoryInGb: virtualInstance.memoryInGb,
            platform: virtualInstance.platform,
            storageInGb: virtualInstance.storageInGb,
        });

        const [user] = await Promise.all([
            this.userRepository.getById(instance.getData().userId),
            this.instanceRepository.update(instance),
        ]);

        if (!user) throw ApplicationError.resourceNotFound();

        const notification = new InstanceProvisionedNotification(
            user.getData().username,
            instance,
            virtualInstance.state,
        );

        await this.notificationPublisher.publish(notification);
    };
}
