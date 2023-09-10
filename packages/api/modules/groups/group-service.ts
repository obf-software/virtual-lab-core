import { GroupRepository } from './group-repository';

export class GroupService {
    private groupRepository: GroupRepository;

    constructor(groupRepository: GroupRepository) {
        this.groupRepository = groupRepository;
    }

    async list(pagination: { resultsPerPage: number; page: number }) {
        return this.groupRepository.list(pagination);
    }
}
