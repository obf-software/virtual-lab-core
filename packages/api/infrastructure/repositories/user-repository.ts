import { eq, sql } from 'drizzle-orm';
import { DatabaseClient, SeekPaginated, schema } from './protocols';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export class UserRepository {
    private dbClient: DatabaseClient;

    constructor(dbClient: DatabaseClient) {
        this.dbClient = dbClient;
    }

    async create(data: typeof schema.user.$inferInsert) {
        const newUsers = await this.dbClient.insert(schema.user).values(data).returning().execute();
        return newUsers.length !== 0 ? newUsers[0] : undefined;
    }

    async getByUsername(username: string) {
        return await this.dbClient.query.user.findFirst({
            where: (user, builder) => builder.eq(user.username, username),
        });
    }

    async getById(id: number) {
        return await this.dbClient.query.user.findFirst({
            where: (user, builder) => builder.eq(user.id, id),
        });
    }

    async list(pagination: { resultsPerPage: number; page: number }) {
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

    async updateById(id: number, data: Partial<typeof schema.user.$inferInsert>) {
        const users = await this.dbClient
            .update(schema.user)
            .set({
                ...data,
                updatedAt: dayjs.utc().toDate(),
            })
            .where(eq(schema.user.id, id))
            .returning()
            .execute();

        return users.length !== 0 ? users[0] : undefined;
    }

    async updateByUsername(username: string, data: Partial<typeof schema.user.$inferInsert>) {
        const users = await this.dbClient
            .update(schema.user)
            .set({
                ...data,
                updatedAt: dayjs.utc().toDate(),
            })
            .where(eq(schema.user.username, username))
            .returning()
            .execute();

        return users.length !== 0 ? users[0] : undefined;
    }
}
