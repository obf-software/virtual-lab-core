import { eq, sql } from 'drizzle-orm';
import * as schema from '../../drizzle/schema';
import { DatabaseClient } from '../../protocols/db';
import { SeekPaginated } from '../../protocols/pagination';
import { UserRole } from './protocols';

export class UserRepository {
    private dbClient: DatabaseClient;

    constructor(dbClient: DatabaseClient) {
        this.dbClient = dbClient;
    }

    async create(data: typeof schema.user.$inferInsert) {
        const newUser = await this.dbClient.insert(schema.user).values(data).returning().execute();

        if (newUser.length !== 1) {
            throw new Error('Could not create user');
        }

        await this.dbClient
            .insert(schema.quota)
            .values({
                userId: newUser[0].id,
                maxInstances: 5,
            })
            .execute();

        return newUser[0];
    }

    async exists(username: string): Promise<boolean> {
        const user = await this.dbClient.query.user.findFirst({
            where: (user, builder) => builder.eq(user.username, username),
            columns: { id: true },
        });

        return user !== undefined;
    }

    async updateLastLoginAt(userId: number): Promise<void> {
        await this.dbClient
            .update(schema.user)
            .set({ lastLoginAt: new Date().toISOString() })
            .where(eq(schema.user.id, userId))
            .execute();
    }

    async getByUsername(username: string) {
        const user = await this.dbClient.query.user.findFirst({
            where: (user, builder) => builder.eq(user.username, username),
        });

        return user;
    }

    async list(pagination: { resultsPerPage: number; page: number }) {
        const [countResult] = await this.dbClient
            .select({ count: sql`count(*)`.mapWith(Number).as('count') })
            .from(schema.user)
            .execute();

        const users = await this.dbClient.query.user
            .findMany({
                limit: pagination.resultsPerPage,
                offset: pagination.resultsPerPage * (pagination.page - 1),
                orderBy: (user, builder) => builder.desc(user.createdAt),
            })
            .execute();

        return {
            data: users,
            numberOfPages: Math.ceil(countResult.count / pagination.resultsPerPage),
            resultsPerPage: pagination.resultsPerPage,
            numberOfResults: countResult.count,
        } satisfies SeekPaginated<typeof schema.user.$inferSelect>;
    }

    async listGroups(userId: number, pagination: { resultsPerPage: number; page: number }) {
        const [countResult] = await this.dbClient
            .select({ count: sql`count(*)`.mapWith(Number).as('count') })
            .from(schema.userToGroup)
            .where(eq(schema.userToGroup.userId, userId))
            .execute();

        const groups = await this.dbClient.query.group
            .findMany({
                limit: pagination.resultsPerPage,
                offset: pagination.resultsPerPage * (pagination.page - 1),
                orderBy: (group, builder) => builder.desc(group.createdAt),
                with: {
                    userToGroup: {
                        where: (userToGroup, builder) => builder.eq(userToGroup.userId, userId),
                    },
                },
            })
            .execute();

        return {
            data: groups,
            numberOfPages: Math.ceil(countResult.count / pagination.resultsPerPage),
            resultsPerPage: pagination.resultsPerPage,
            numberOfResults: countResult.count,
        } satisfies SeekPaginated<typeof schema.group.$inferSelect>;
    }

    async updateRole(userId: number, role: keyof typeof UserRole) {
        await this.dbClient
            .update(schema.user)
            .set({ role })
            .where(eq(schema.user.id, userId))
            .execute();
    }
}
