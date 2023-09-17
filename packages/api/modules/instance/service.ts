import { InstanceRepository } from './repository';

export class InstanceService {
    private instanceRepository: InstanceRepository;

    constructor(instanceRepository: InstanceRepository) {
        this.instanceRepository = instanceRepository;
    }

    async listUserInstances(
        userId: number,
        pagination: {
            resultsPerPage: number;
            page: number;
        },
    ) {
        return this.instanceRepository.listUserInstances(userId, pagination);
    }
}
