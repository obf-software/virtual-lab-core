import { ObjectId } from 'mongodb';
import { UserRepository } from '../../application/user-repository';
import { User, UserData } from '../../domain/entities/user';
import { SeekPaginated, SeekPaginationInput } from '../../domain/dtos/seek-paginated';
import { randomUUID } from 'node:crypto';

export class InMemoryUserRepository implements UserRepository {
    constructor(private storage: UserData[] = []) {}

    addTestRecord = (data: Partial<UserData> = {}) => {
        const record = {
            id: data.id ?? new ObjectId().toHexString(),
            username: data.username ?? randomUUID(),
            name: data.name,
            preferredUsername: data.preferredUsername,
            role: data.role ?? 'USER',
            createdAt: data.createdAt ?? new Date(),
            updatedAt: data.updatedAt ?? new Date(),
            lastLoginAt: data.lastLoginAt,
            quotas: data.quotas ?? {
                allowedInstanceTypes: [],
                canLaunchInstanceWithHibernation: false,
                maxInstances: 1,
            },
        } satisfies UserData;

        this.storage.push(record);
        return record;
    };

    reset = () => {
        this.storage = [];
    };

    save = async (user: User): Promise<string> => {
        const id = new ObjectId().toHexString();
        this.storage.push({ ...user.getData(), id });
        return Promise.resolve(id);
    };

    getById = async (id: string): Promise<User | undefined> => {
        const userData = this.storage.find((user) => user.id === id);
        if (!userData) return undefined;
        return Promise.resolve(User.restore({ ...userData, id }));
    };

    getByUsername = async (username: string): Promise<User | undefined> => {
        const userData = this.storage.find((user) => user.username === username);
        if (!userData) return undefined;
        return Promise.resolve(User.restore({ ...userData, id: userData.id! }));
    };

    list = async (
        match: {
            textSearch?: string;
        },
        orderBy: 'creationDate' | 'lastUpdateDate' | 'lastLoginDate' | 'alphabetical',
        order: 'asc' | 'desc',
        pagination: SeekPaginationInput,
    ): Promise<SeekPaginated<User>> => {
        const filteredUsers = this.storage.filter((f) => {
            const matchArray = [];

            if (match.textSearch) {
                matchArray.push(f.name?.toLowerCase().includes(match.textSearch));
            }

            return matchArray.every((m) => m);
        });

        const orderedUsers = [...filteredUsers].sort((a, b) => {
            const orderMap: Record<typeof orderBy, (string | number)[]> = {
                creationDate: [a.createdAt.getTime(), b.createdAt.getTime()],
                lastUpdateDate: [a.updatedAt.getTime(), b.updatedAt.getTime()],
                lastLoginDate: [a.lastLoginAt?.getTime() ?? 0, b.lastLoginAt?.getTime() ?? 0],
                alphabetical: [a.name?.toLowerCase() ?? '', b.name?.toLowerCase() ?? ''],
            };

            const [aValue, bValue] = orderMap[orderBy];

            if (order === 'asc') {
                return aValue > bValue ? 1 : -1;
            }

            return aValue < bValue ? 1 : -1;
        });

        const paginatedUsers = orderedUsers.slice(
            pagination.resultsPerPage * (pagination.page - 1),
            pagination.resultsPerPage * pagination.page,
        );

        return Promise.resolve({
            data: paginatedUsers.map((f) => User.restore({ ...f, id: f.id! })),
            numberOfResults: orderedUsers.length,
            numberOfPages: Math.ceil(orderedUsers.length / pagination.resultsPerPage),
            resultsPerPage: pagination.resultsPerPage,
        });
    };

    listByIds = async (ids: string[]): Promise<User[]> => {
        const users = this.storage.filter((f) => ids.includes(f.id!));
        return Promise.resolve(users.map((u) => User.restore({ ...u, id: u.id! })));
    };

    update = async (user: User): Promise<void> => {
        const userData = this.storage.find((f) => f.id === user.id);
        if (!userData) return Promise.resolve();
        this.storage = this.storage.map((f) => (f.id === user.id ? user.getData() : f));
        return Promise.resolve();
    };

    bulkUpdate = async (users: User[]): Promise<void> => {
        const updatedUsers = this.storage.map((f) => {
            const user = users.find((u) => u.id === f.id);
            return user ? user.getData() : f;
        });

        this.storage = updatedUsers;

        return Promise.resolve();
    };
}
