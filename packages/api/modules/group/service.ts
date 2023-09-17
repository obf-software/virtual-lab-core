import { GroupRepository } from './repository';

export class GroupService {
    private groupRepository: GroupRepository;

    constructor(groupRepository: GroupRepository) {
        this.groupRepository = groupRepository;
    }

    async listGroups(pagination: { resultsPerPage: number; page: number }) {
        return this.groupRepository.listGroups(pagination);
    }

    async listUserGroups(userId: number, pagination: { resultsPerPage: number; page: number }) {
        return this.groupRepository.listUserGroups(userId, pagination);
    }
}
