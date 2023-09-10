import { eq, sql } from 'drizzle-orm';
import * as schema from '../../drizzle/schema';
import { DatabaseClient } from '../../protocols/db';
import { SeekPaginated } from '../../protocols/pagination';

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

        return newUser[0];
    }

    async exists(username: string): Promise<boolean> {
        const user = await this.dbClient.query.user.findFirst({
            where: (user, builder) => builder.eq(user.username, username),
            columns: { id: true },
        });

        return user !== undefined;
    }

    async updateLastLoginAt(username: string): Promise<void> {
        await this.dbClient
            .update(schema.user)
            .set({ lastLoginAt: new Date().toISOString() })
            .where(eq(schema.user.username, username))
            .execute();
    }

    async getRole(username: string) {
        const user = await this.dbClient.query.user.findFirst({
            where: (user, builder) => builder.eq(user.username, username),
            columns: { role: true },
        });

        return user?.role;
    }

    async list(pagination: { resultsPerPage: number; page: number }) {
        const [countResult] = await this.dbClient
            .select({
                count: sql`count(*)`.mapWith(Number).as('count'),
            })
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
        } satisfies SeekPaginated<typeof schema.user.$inferInsert>;
    }
}
