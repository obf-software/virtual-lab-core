import { DatabaseClient } from '../../protocols/db';
import * as schema from '../../drizzle/schema';
import { sql } from 'drizzle-orm';
import { SeekPaginated } from '../../protocols/pagination';

export class GroupRepository {
    private dbClient: DatabaseClient;

    constructor(dbClient: DatabaseClient) {
        this.dbClient = dbClient;
    }

    async list(pagination: { resultsPerPage: number; page: number }) {
        const [countResult] = await this.dbClient
            .select({ count: sql`count(*)`.mapWith(Number).as('count') })
            .from(schema.group)
            .execute();

        const groups = await this.dbClient.query.group
            .findMany({
                limit: pagination.resultsPerPage,
                offset: pagination.resultsPerPage * (pagination.page - 1),
                orderBy: (group, builder) => builder.desc(group.createdAt),
            })
            .execute();

        return {
            data: groups,
            numberOfPages: Math.ceil(countResult.count / pagination.resultsPerPage),
            resultsPerPage: pagination.resultsPerPage,
            numberOfResults: countResult.count,
        } satisfies SeekPaginated<typeof schema.group.$inferSelect>;
    }
}
