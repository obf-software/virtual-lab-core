import { Group } from '../../services/api/protocols';

export interface GroupsContextData {
    loadGroupsPage: (page: number, resultsPerPage: number) => Promise<void>;
    numberOfPages: number;
    numberOfResults: number;
    isLoading: boolean;
    groups: Group[];
}
