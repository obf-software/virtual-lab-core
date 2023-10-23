import { Principal } from '../../../domain/dtos/principal';
import { AuthError } from '../../../domain/errors/auth-error';
import { Auth } from '../../auth';
import { CatalogGateway, Portfolio } from '../../catalog-gateway';
import { Logger } from '../../logger';

export interface ListPortfoliosInput {
    principal: Principal;
}

export type ListPortfoliosOutput = Portfolio[];

export class ListPortfolios {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly catalogGateway: CatalogGateway,
    ) {}

    execute = async (input: ListPortfoliosInput): Promise<ListPortfoliosOutput> => {
        this.logger.debug('ListPortfolios.execute', { input });

        this.auth.assertThatHasRoleOrAbove(
            input.principal,
            'ADMIN',
            AuthError.insufficientRole('ADMIN'),
        );

        return await this.catalogGateway.listPortfolios();
    };
}
