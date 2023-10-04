import { eq } from 'drizzle-orm';
import { DatabaseClient, schema } from './protocols';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export class QuotaRepository {
    private dbClient: DatabaseClient;

    constructor(dbClient: DatabaseClient) {
        this.dbClient = dbClient;
    }

    async create(data: typeof schema.quota.$inferInsert) {
        const newQuotas = await this.dbClient
            .insert(schema.quota)
            .values(data)
            .returning()
            .execute();
        return newQuotas.length !== 0 ? newQuotas[0] : undefined;
    }

    async getByUserId(userId: number) {
        const quotas = await this.dbClient.query.quota
            .findFirst({
                where: (quota, builder) => builder.and(eq(quota.userId, userId)),
            })
            .execute();
        return quotas;
    }

    async updateByUserId(userId: number, data: Partial<typeof schema.quota.$inferInsert>) {
        const updateQuotas = await this.dbClient
            .update(schema.quota)
            .set(data)
            .where(eq(schema.quota.userId, userId))
            .returning()
            .execute();
        return updateQuotas.length !== 0 ? updateQuotas[0] : undefined;
    }
}
