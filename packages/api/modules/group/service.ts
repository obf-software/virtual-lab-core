import { GroupRepository } from './repository';
import * as schema from '../../drizzle/schema';
import { AwsServiceCatalogIntegration } from '../../integrations/aws-service-catalog/service';
import createHttpError from 'http-errors';

export class GroupService {
    private groupRepository: GroupRepository;
    private awsServiceCatalogIntegration: AwsServiceCatalogIntegration;

    constructor(props: {
        groupRepository: GroupRepository;
        awsServiceCatalogIntegration: AwsServiceCatalogIntegration;
    }) {
        this.groupRepository = props.groupRepository;
        this.awsServiceCatalogIntegration = props.awsServiceCatalogIntegration;
    }

    async createGroup(data: typeof schema.group.$inferInsert) {
        const portfolioExists = await this.awsServiceCatalogIntegration.portfolioExists(
            data.awsPortfolioId,
        );

        if (!portfolioExists) {
            throw new createHttpError.BadRequest('AWS Portfolio does not exist');
        }

        return await this.groupRepository.createGroup(data);
    }

    async listGroups(pagination: { resultsPerPage: number; page: number }) {
        return await this.groupRepository.listGroups(pagination);
    }

    async listUserGroups(userId: number, pagination: { resultsPerPage: number; page: number }) {
        return await this.groupRepository.listUserGroups(userId, pagination);
    }

    async deleteGroup(groupId: number) {
        return await this.groupRepository.deleteGroup(groupId);
    }

    async listUserGroupAwsPortfolioIds(userId: number) {
        return await this.groupRepository.listUserGroupAwsPortfolioIds(userId);
    }
}
