import { Group } from '../../services/api/protocols';

export interface MyGroupsContextData {
    loadMyGroupsPage: (page: number, resultsPerPage: number) => Promise<void>;
    numberOfPages: number;
    numberOfResults: number;
    isLoading: boolean;
    myGroups: Group[];
}
