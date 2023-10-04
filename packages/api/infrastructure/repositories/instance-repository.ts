import { eq, sql } from 'drizzle-orm';
import { DatabaseClient, SeekPaginated, schema } from './protocols';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export class InstanceRepository {
    private dbClient: DatabaseClient;

    constructor(dbClient: DatabaseClient) {
        this.dbClient = dbClient;
    }

    async create(data: typeof schema.instance.$inferInsert) {
        const createdInstances = await this.dbClient
            .insert(schema.instance)
            .values(data)
            .returning()
            .execute();

        return createdInstances.length !== 0 ? createdInstances[0] : undefined;
    }

    async getByAwsInstanceId(awsInstanceId: string) {
        return await this.dbClient.query.instance
            .findFirst({
                where: (instance, builder) => builder.eq(instance.awsInstanceId, awsInstanceId),
            })
            .execute();
    }

    async getById(id: number) {
        return await this.dbClient.query.instance
            .findFirst({ where: (instance, builder) => builder.eq(instance.id, id) })
            .execute();
    }

    async listByUser(
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

    async updateByAwsProvisionedProductName(
        awsProvisionedProductName: string,
        data: Partial<typeof schema.instance.$inferInsert>,
    ) {
        const updatedInstances = await this.dbClient
            .update(schema.instance)
            .set({
                ...data,
                updatedAt: dayjs.utc().toDate(),
            })
            .where(eq(schema.instance.awsProvisionedProductName, awsProvisionedProductName))
            .returning()
            .execute();

        return updatedInstances.length !== 0 ? updatedInstances[0] : undefined;
    }

    async updateLastConnectionAtById(id: number) {
        const updatedInstances = await this.dbClient
            .update(schema.instance)
            .set({
                lastConnectionAt: dayjs.utc().toDate(),
            })
            .where(eq(schema.instance.id, id))
            .returning()
            .execute();

        return updatedInstances.length !== 0 ? updatedInstances[0] : undefined;
    }

    async deleteById(id: number) {
        const deletedInstances = await this.dbClient
            .delete(schema.instance)
            .where(eq(schema.instance.id, id))
            .returning()
            .execute();
        return deletedInstances.length !== 0 ? deletedInstances[0] : undefined;
    }
}
