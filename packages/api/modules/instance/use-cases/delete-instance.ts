import createHttpError from 'http-errors';
import { Principal } from '../../../infrastructure/auth/protocols';
import { InstanceRepository } from '../../../infrastructure/repositories';
import { ServiceCatalog } from '../../../infrastructure/aws/service-catalog';
import { Logger } from '@aws-lambda-powertools/logger';
import { throwIfInsufficientRole } from '../../../infrastructure/auth/throw-if-insufficient-role';
import { hasRoleOrAbove } from '../../../infrastructure/auth/has-role-or-above';
import { IUseCase } from '../../../domain/interfaces';

export class DeleteInstanceUseCase implements IUseCase {
    constructor(
        private readonly logger: Logger,
        private readonly instanceRepository: InstanceRepository,
        private readonly serviceCatalog: ServiceCatalog,
    ) {}

    execute = async (props: { principal: Principal; instanceId: number }) => {
        throwIfInsufficientRole('USER', props.principal.role);

        if (Number.isNaN(props.instanceId)) {
            throw new createHttpError.NotFound('Instance not found');
        }

        const instance = await this.instanceRepository.getById(props.instanceId);

        if (
            !hasRoleOrAbove('ADMIN', props.principal.role) &&
            props.principal.userId !== instance?.userId
        ) {
            throw new createHttpError.Forbidden('You are not authorized to perform this action');
        }

        const deletedInstance = await this.instanceRepository.deleteById(props.instanceId);

        if (deletedInstance === undefined) {
            throw new createHttpError.NotFound('Instance not found');
        }

        try {
            await this.serviceCatalog.terminateProvisionedProductByName(
                deletedInstance.awsProvisionedProductName,
            );
        } catch (error) {
            this.logger.error(
                `Instance ${deletedInstance.id} was deleted from the database but the Service Catalog product was not terminated.`,
                { error },
            );
        }

        return deletedInstance.id;
    };
}
