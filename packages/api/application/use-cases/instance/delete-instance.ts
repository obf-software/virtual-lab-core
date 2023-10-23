import { Principal } from '../../../domain/dtos/principal';
import { ApplicationError } from '../../../domain/errors/application-error';
import { AuthError } from '../../../domain/errors/auth-error';
import { Auth } from '../../auth';
import { CatalogGateway } from '../../catalog-gateway';
import { Logger } from '../../logger';
import { InstanceRepository } from '../../repositories/instance-repository';

export interface DeleteInstanceInput {
    principal: Principal;
    instanceId: number;
}

export type DeleteInstanceOutput = void;

export class DeleteInstance {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly instanceRepository: InstanceRepository,
        private readonly catalogGateway: CatalogGateway,
    ) {}

    execute = async (input: DeleteInstanceInput): Promise<DeleteInstanceOutput> => {
        this.logger.debug('DeleteInstance.execute', { input });

        this.auth.assertThatHasRoleOrAbove(
            input.principal,
            'USER',
            AuthError.insufficientRole('USER'),
        );

        const principalId = this.auth.getId(input.principal);
        const instance = await this.instanceRepository.getById(input.instanceId);
        if (instance === undefined) throw ApplicationError.resourceNotFound();

        if (
            !this.auth.hasRoleOrAbove(input.principal, 'ADMIN') &&
            instance.getData().userId !== principalId
        ) {
            throw AuthError.insufficientRole('ADMIN');
        }

        await Promise.allSettled([
            this.instanceRepository.delete(instance),
            this.catalogGateway.terminateProvisionedProductById(
                instance.getData().provisionedProductId,
            ),
        ]);
    };

    // execute = async (props: { principal: Principal; instanceId: number }) => {
    //     throwIfInsufficientRole('USER', props.principal.role);

    //     if (Number.isNaN(props.instanceId)) {
    //         throw new createHttpError.NotFound('Instance not found');
    //     }

    //     const instance = await this.instanceRepository.getById(props.instanceId);

    //     if (
    //         !hasRoleOrAbove('ADMIN', props.principal.role) &&
    //         props.principal.userId !== instance?.userId
    //     ) {
    //         throw new createHttpError.Forbidden('You are not authorized to perform this action');
    //     }

    //     const deletedInstance = await this.instanceRepository.deleteById(props.instanceId);

    //     if (deletedInstance === undefined) {
    //         throw new createHttpError.NotFound('Instance not found');
    //     }

    //     try {
    //         await this.serviceCatalog.terminateProvisionedProductByName(
    //             deletedInstance.awsProvisionedProductName,
    //         );
    //     } catch (error) {
    //         this.logger.error(
    //             `Instance ${deletedInstance.id} was deleted from the database but the Service Catalog product was not terminated.`,
    //             { error },
    //         );
    //     }

    //     return deletedInstance.id;
    // };
}
