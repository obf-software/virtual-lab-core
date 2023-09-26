import * as schema from '../../drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import { DatabaseClient, SeekPaginated } from '../core/protocols';

export class GroupRepository {
    private dbClient: DatabaseClient;

    constructor(dbClient: DatabaseClient) {
        this.dbClient = dbClient;
    }

    async createGroup(data: typeof schema.group.$inferInsert) {
        const newGroup = await this.dbClient
            .insert(schema.group)
            .values(data)
            .returning()
            .execute();

        if (newGroup.length !== 1) {
            throw new Error('Could not create group');
        }

        return newGroup[0];
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

    async deleteGroup(groupId: number) {
        await this.dbClient
            .delete(schema.userToGroup)
            .where(eq(schema.userToGroup.groupId, groupId))
            .returning()
            .execute();

        const deleteGroups = await this.dbClient
            .delete(schema.group)
            .where(eq(schema.group.id, groupId))
            .returning()
            .execute();

        if (deleteGroups.length === 0) {
            return undefined;
        }

        return deleteGroups[0];
    }

    async listUserGroupAwsPortfolioIds(userId: number) {
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
}
