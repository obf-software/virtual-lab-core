import * as schema from '../../drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import { DatabaseClient, SeekPaginated } from '../core/protocols';

export class InstanceRepository {
    private dbClient: DatabaseClient;

    constructor(dbClient: DatabaseClient) {
        this.dbClient = dbClient;
    }

    async listUserInstances(
        userId: number,
        pagination: {
            resultsPerPage: number;
            page: number;
        },
    ) {
        const [[countResult], instances] = await Promise.all([
            this.dbClient
                .select({ count: sql`count(*)`.mapWith(Number).as('count') })
                .from(schema.instance)
                .where(eq(schema.instance.userId, userId))
                .execute(),
            this.dbClient.query.instance
                .findMany({
                    limit: pagination.resultsPerPage,
                    offset: pagination.resultsPerPage * (pagination.page - 1),
                    orderBy: (instance, builder) => builder.desc(instance.createdAt),
                    where: (instance, builder) => builder.eq(instance.userId, userId),
                })
                .execute(),
        ]);

        return {
            data: instances,
            numberOfPages: Math.ceil(countResult.count / pagination.resultsPerPage),
            resultsPerPage: pagination.resultsPerPage,
            numberOfResults: countResult.count,
        } satisfies SeekPaginated<typeof schema.instance.$inferSelect>;
    }
}
