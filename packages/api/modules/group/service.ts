import { GroupRepository } from './repository';
import * as schema from '../../drizzle/schema';
import { AwsServiceCatalogIntegration } from '../../integrations/aws-service-catalog/service';

export class GroupService {
    private groupRepository: GroupRepository;
    private awsServiceCatalogIntegration: AwsServiceCatalogIntegration;

    constructor(
        groupRepository: GroupRepository,
        awsServiceCatalogIntegration: AwsServiceCatalogIntegration,
    ) {
        this.groupRepository = groupRepository;
        this.awsServiceCatalogIntegration = awsServiceCatalogIntegration;
    }

    async createGroup(data: typeof schema.group.$inferInsert) {
        const portfolioExists = await this.awsServiceCatalogIntegration.portfolioExists(
            data.awsPortfolioId,
        );

        if (!portfolioExists) {
            throw new Error('Invalid AWS Portfolio ID');
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
}
