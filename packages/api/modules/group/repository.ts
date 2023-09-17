import * as schema from '../../drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import { DatabaseClient, SeekPaginated } from '../core/protocols';

export class GroupRepository {
    private dbClient: DatabaseClient;

    constructor(dbClient: DatabaseClient) {
        this.dbClient = dbClient;
    }

    async listGroups(pagination: { resultsPerPage: number; page: number }) {
        const [[countResult], groups] = await Promise.all([
            this.dbClient
                .select({ count: sql`count(*)`.mapWith(Number).as('count') })
                .from(schema.group)
                .execute(),
            this.dbClient.query.group
                .findMany({
                    limit: pagination.resultsPerPage,
                    offset: pagination.resultsPerPage * (pagination.page - 1),
                    orderBy: (group, builder) => builder.desc(group.createdAt),
                })
                .execute(),
        ]);

        return {
            data: groups,
            numberOfPages: Math.ceil(countResult.count / pagination.resultsPerPage),
            resultsPerPage: pagination.resultsPerPage,
            numberOfResults: countResult.count,
        } satisfies SeekPaginated<typeof schema.group.$inferSelect>;
    }

    async listUserGroups(userId: number, pagination: { resultsPerPage: number; page: number }) {
        const [[countResult], groups] = await Promise.all([
            this.dbClient
                .select({ count: sql`count(*)`.mapWith(Number).as('count') })
                .from(schema.userToGroup)
                .where(eq(schema.userToGroup.userId, userId))
                .execute(),
            this.dbClient.query.group
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
                .execute(),
        ]);

        return {
            data: groups,
            numberOfPages: Math.ceil(countResult.count / pagination.resultsPerPage),
            resultsPerPage: pagination.resultsPerPage,
            numberOfResults: countResult.count,
        } satisfies SeekPaginated<typeof schema.group.$inferSelect>;
    }
}
