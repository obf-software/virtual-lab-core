import { SeekPaginationInput } from '../../domain/dtos/seek-pagination-input';
import { UserRepository } from '../../application/repositories/user-repository';
import { SeekPaginated } from '../domain/dtos/seek-paginated';
import { User } from '../domain/entities/user';
import { PostgresJsDatabase, drizzle } from 'drizzle-orm/postgres-js';
import * as dbSchema from './database/schema';
import createHttpError from 'http-errors';
import { Role } from '../domain/dtos/role';
import { eq, sql } from 'drizzle-orm';
import postgres from 'postgres';

export class UserDatabaseRepository implements UserRepository {
    private dbClient: PostgresJsDatabase<typeof dbSchema>;

    constructor(DATABASE_URL: string) {
        this.dbClient = drizzle(postgres(DATABASE_URL), { schema: dbSchema });
    }

    save = async (user: User): Promise<number> => {
        const userData = user.getData();
        const newUser = await this.dbClient
            .insert(dbSchema.user)
            .values({
                username: userData.username,
                role: userData.role,
                createdAt: userData.createdAt,
                updatedAt: userData.updatedAt,
                lastLoginAt: userData.lastLoginAt,
            })
            .returning()
            .execute();

        const newUserId = newUser.length !== 0 ? newUser[0].id : undefined;

        if (newUserId === undefined) {
            throw new createHttpError.InternalServerError();
        }

        await this.dbClient.insert(dbSchema.quota).values({
            userId: newUserId,
            maxInstances: userData.maxInstances,
        });

        return newUserId;
    };

    getById = async (id: number): Promise<User | undefined> => {
        const user = await this.dbClient.query.user.findFirst({
            where: (user, builder) => builder.eq(user.id, id),
            with: {
                quota: {
                    columns: {
                        maxInstances: true,
                    },
                },
            },
        });

        if (!user) return undefined;

        return User.restore({
            id: user.id,
            role: Role[user.role],
            username: user.username,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastLoginAt: user.lastLoginAt,
            maxInstances: user.quota.maxInstances,
        });
    };

    getByUsername = async (username: string): Promise<User | undefined> => {
        const user = await this.dbClient.query.user.findFirst({
            where: (user, builder) => builder.eq(user.username, username),
            with: {
                quota: {
                    columns: {
                        maxInstances: true,
                    },
                },
            },
        });

        if (!user) return undefined;

        return User.restore({
            id: user.id,
            role: Role[user.role],
            username: user.username,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastLoginAt: user.lastLoginAt,
            maxInstances: user.quota.maxInstances,
        });
    };

    list = async (pagination: SeekPaginationInput): Promise<SeekPaginated<User>> => {
        const [[countResult], users] = await Promise.all([
            this.dbClient
                .select({ count: sql`count(*)`.mapWith(Number).as('count') })
                .from(dbSchema.user)
                .execute(),
            this.dbClient.query.user
                .findMany({
                    limit: pagination.resultsPerPage,
                    offset: pagination.resultsPerPage * (pagination.page - 1),
                    orderBy: (user, builder) => builder.desc(user.createdAt),
                    with: {
                        quota: {
                            columns: {
                                maxInstances: true,
                            },
                        },
                    },
                })
                .execute(),
        ]);

        return {
            data: users.map((user) =>
                User.restore({
                    id: user.id,
                    role: Role[user.role],
                    username: user.username,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                    lastLoginAt: user.lastLoginAt,
                    maxInstances: user.quota.maxInstances,
                }),
            ),
            numberOfPages: Math.ceil(countResult.count / pagination.resultsPerPage),
            resultsPerPage: pagination.resultsPerPage,
            numberOfResults: countResult.count,
        };
    };

    search = async (textQuery: string): Promise<User[]> => {
        const users = await this.dbClient.query.user.findMany({
            where: (user, builder) => builder.ilike(user.username, `%${textQuery}%`),
            with: {
                quota: {
                    columns: {
                        maxInstances: true,
                    },
                },
            },
            limit: 50,
        });

        return users.map((user) =>
            User.restore({
                id: user.id,
                username: user.username,
                role: Role[user.role],
                maxInstances: user.quota.maxInstances,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                lastLoginAt: user.lastLoginAt,
            }),
        );
    };

    listByGroup = async (
        groupId: number,
        pagination: SeekPaginationInput,
    ): Promise<SeekPaginated<User>> => {
        const [[countResult], users] = await Promise.all([
            this.dbClient
                .select({ count: sql`count(*)`.mapWith(Number).as('count') })
                .from(dbSchema.userToGroup)
                .where(eq(dbSchema.userToGroup.groupId, groupId))
                .execute(),
            this.dbClient
                .select({
                    user: dbSchema.user,
                    quota: dbSchema.quota,
                })
                .from(dbSchema.user)
                .innerJoin(dbSchema.userToGroup, eq(dbSchema.user.id, dbSchema.userToGroup.userId))
                .innerJoin(dbSchema.quota, eq(dbSchema.user.id, dbSchema.quota.userId))
                .where(eq(dbSchema.userToGroup.groupId, groupId))
                .limit(pagination.resultsPerPage)
                .offset(pagination.resultsPerPage * (pagination.page - 1))
                .execute(),
        ]);

        return {
            data: users.map(({ user, quota }) =>
                User.restore({
                    id: user.id,
                    role: Role[user.role],
                    username: user.username,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                    lastLoginAt: user.lastLoginAt,
                    maxInstances: quota.maxInstances,
                }),
            ),
            numberOfPages: Math.ceil(countResult.count / pagination.resultsPerPage),
            resultsPerPage: pagination.resultsPerPage,
            numberOfResults: countResult.count,
        };
    };

    update = async (user: User): Promise<void> => {
        const userData = user.getData();
        await this.dbClient
            .update(dbSchema.user)
            .set({
                role: userData.role,
                username: userData.username,
                createdAt: userData.createdAt,
                updatedAt: userData.updatedAt,
                lastLoginAt: userData.lastLoginAt,
            })
            .where(eq(dbSchema.user.id, user.id))
            .execute();

        await this.dbClient
            .update(dbSchema.quota)
            .set({
                maxInstances: userData.maxInstances,
            })
            .where(eq(dbSchema.quota.userId, user.id))
            .execute();
    };
}
