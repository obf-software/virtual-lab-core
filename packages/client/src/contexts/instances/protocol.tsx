import { Instance } from '../../services/api/protocols';

export interface InstancesContextData {
    loadInstancesPage: (page: number, resultsPerPage: number) => Promise<void>;
    activePage: number;
    numberOfPages: number;
    numberOfResults: number;
    isLoading: boolean;
    instances: Instance[];
    lastLoadAt?: Date;
}
