import { Instance } from '../../services/api/protocols';

export interface InstancesContextData {
    loadInstancesPage: (page: number, resultsPerPage: number) => Promise<void>;
    getConnectionString: (instanceId: number) => Promise<string>;
    activePage: number;
    numberOfPages: number;
    numberOfResults: number;
    isLoading: boolean;
    instances: Instance[];
    lastLoadAt?: Date;
}
