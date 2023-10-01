import * as schema from '../../drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import { DatabaseClient, SeekPaginated } from '../core/protocols';

export class InstanceRepository {
    private dbClient: DatabaseClient;

    constructor(dbClient: DatabaseClient) {
        this.dbClient = dbClient;
    }

    async getInstanceByAwsInstanceId(awsInstanceId: string) {
        const instance = await this.dbClient.query.instance
            .findFirst({
                where: (instance, builder) => builder.eq(instance.awsInstanceId, awsInstanceId),
            })
            .execute();

        return instance;
    }

    async getInstanceById(instanceId: number) {
        const instance = await this.dbClient.query.instance
            .findFirst({ where: (instance, builder) => builder.eq(instance.id, instanceId) })
            .execute();

        return instance;
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

    async deleteInstance(instanceId: number) {
        const deletedInstances = await this.dbClient
            .delete(schema.instance)
            .where(eq(schema.instance.id, instanceId))
            .returning()
            .execute();

        if (deletedInstances.length === 0) {
            return undefined;
        }

        return deletedInstances[0];
    }

    async updateInstanceByAwsProvisionedProductName(
        awsProvisionedProductName: string,
        data: Partial<typeof schema.instance.$inferInsert>,
    ) {
        const updatedInstances = await this.dbClient
            .update(schema.instance)
            .set(data)
            .where(eq(schema.instance.awsProvisionedProductName, awsProvisionedProductName))
            .returning()
            .execute();

        if (updatedInstances.length === 0) {
            return undefined;
        }

        return updatedInstances[0];
    }

    async createInstance(data: typeof schema.instance.$inferInsert) {
        const createdInstances = await this.dbClient
            .insert(schema.instance)
            .values(data)
            .returning()
            .execute();

        if (createdInstances.length === 0) {
            return undefined;
        }
        return createdInstances[0];
    }
}
