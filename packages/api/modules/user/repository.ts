import { eq, sql } from 'drizzle-orm';
import * as schema from '../../drizzle/schema';
import { UserRole } from './protocols';
import { DatabaseClient, SeekPaginated } from '../core/protocols';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

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
        const date = dayjs.utc().toDate();
        await this.dbClient
            .update(schema.user)
            .set({ lastLoginAt: date, updatedAt: date })
            .where(eq(schema.user.id, userId))
            .execute();
    }

    async getByUsername(username: string) {
        const user = await this.dbClient.query.user.findFirst({
            where: (user, builder) => builder.eq(user.username, username),
        });

        return user;
    }

    async listUsers(pagination: { resultsPerPage: number; page: number }) {
        const [[countResult], users] = await Promise.all([
            this.dbClient
                .select({ count: sql`count(*)`.mapWith(Number).as('count') })
                .from(schema.user)
                .execute(),
            this.dbClient.query.user
                .findMany({
                    limit: pagination.resultsPerPage,
                    offset: pagination.resultsPerPage * (pagination.page - 1),
                    orderBy: (user, builder) => builder.desc(user.createdAt),
                })
                .execute(),
        ]);

        return {
            data: users,
            numberOfPages: Math.ceil(countResult.count / pagination.resultsPerPage),
            resultsPerPage: pagination.resultsPerPage,
            numberOfResults: countResult.count,
        } satisfies SeekPaginated<typeof schema.user.$inferSelect>;
    }

    async updateRole(userId: number, role: keyof typeof UserRole) {
        await this.dbClient
            .update(schema.user)
            .set({ role, updatedAt: dayjs.utc().toDate() })
            .where(eq(schema.user.id, userId))
            .execute();
    }
}
