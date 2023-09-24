import { User, UserRole } from '../../services/api/protocols';

export interface UsersContextData {
    loadUsersPage: (page: number, resultsPerPage: number) => Promise<void>;
    updateUserRole: (userId: number, role: keyof typeof UserRole) => Promise<void>;
    numberOfPages: number;
    numberOfResults: number;
    isLoading: boolean;
    isUpdating: boolean;
    users: User[];
}
