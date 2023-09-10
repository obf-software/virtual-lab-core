import { User } from '../../services/api/protocols';

export interface UsersContextData {
    loadUsersPage: (page: number, resultsPerPage: number) => Promise<void>;
    numberOfPages: number;
    numberOfResults: number;
    isLoading: boolean;
    users: User[];
}
