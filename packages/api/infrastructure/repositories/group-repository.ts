import { and, eq, inArray, sql } from 'drizzle-orm';
import { DatabaseClient, SeekPaginated, schema } from './protocols';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export class GroupRepository {
    private dbClient: DatabaseClient;

    constructor(dbClient: DatabaseClient) {
        this.dbClient = dbClient;
    }

    async create(data: typeof schema.group.$inferInsert) {
        const newGroups = await this.dbClient
            .insert(schema.group)
            .values(data)
            .returning()
            .execute();
        return newGroups.length !== 0 ? newGroups[0] : undefined;
    }

    async list(pagination: { resultsPerPage: number; page: number }) {
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

    async listByUser(userId: number, pagination: { resultsPerPage: number; page: number }) {
        const [[countResult], groups] = await Promise.all([
            this.dbClient
                .select({ count: sql`count(*)`.mapWith(Number).as('count') })
                .from(schema.userToGroup)
                .where(eq(schema.userToGroup.userId, userId))
                .execute(),
            this.dbClient
                .select({
                    group: schema.group,
                })
                .from(schema.group)
                .innerJoin(schema.userToGroup, eq(schema.group.id, schema.userToGroup.groupId))
                .where(eq(schema.userToGroup.userId, userId))
                .limit(pagination.resultsPerPage)
                .offset(pagination.resultsPerPage * (pagination.page - 1))
                .execute(),
        ]);

        return {
            data: groups.map((g) => g.group),
            numberOfPages: Math.ceil(countResult.count / pagination.resultsPerPage),
            resultsPerPage: pagination.resultsPerPage,
            numberOfResults: countResult.count,
        } satisfies SeekPaginated<typeof schema.group.$inferSelect>;
    }

    async listAwsPortfolioIdsByUser(userId: number) {
        const groups = await this.dbClient.query.group
            .findMany({
                with: {
                    userToGroup: {
                        where: (userToGroup, builder) => builder.eq(userToGroup.userId, userId),
                    },
                },
                columns: {
                    awsPortfolioId: true,
                },
            })
            .execute();

        return [...new Set(groups.map((g) => g.awsPortfolioId))];
    }

    async addUsersToGroup(groupId: number, userIds: number[]) {
        return await this.dbClient
            .insert(schema.userToGroup)
            .values(userIds.map((userId) => ({ userId, groupId })))
            .returning()
            .execute();
    }

    async removeUsersFromGroup(groupId: number, userIds: number[]) {
        return await this.dbClient
            .delete(schema.userToGroup)
            .where(
                and(
                    eq(schema.userToGroup.groupId, groupId),
                    inArray(schema.userToGroup.userId, userIds),
                ),
            )
            .returning()
            .execute();
    }

    async deleteById(id: number) {
        await this.dbClient
            .delete(schema.userToGroup)
            .where(eq(schema.userToGroup.groupId, id))
            .returning()
            .execute();

        const deleteGroups = await this.dbClient
            .delete(schema.group)
            .where(eq(schema.group.id, id))
            .returning()
            .execute();

        return deleteGroups.length !== 0 ? deleteGroups[0] : undefined;
    }
}
