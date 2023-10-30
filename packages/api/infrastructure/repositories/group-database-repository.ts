import { PostgresJsDatabase, drizzle } from 'drizzle-orm/postgres-js';
import { GroupRepository } from '../../application/repositories/group-repository';
import { SeekPaginated } from '../../domain/dtos/seek-paginated';
import { Group } from '../../domain/entities/group';
import * as dbSchema from '../database/schema';
import createHttpError from 'http-errors';
import { SeekPaginationInput } from '../../domain/dtos/seek-pagination-input';
import { and, eq, inArray, sql } from 'drizzle-orm';
import postgres from 'postgres';

export class GroupDatabaseRepository implements GroupRepository {
    private dbClient: PostgresJsDatabase<typeof dbSchema>;

    constructor(DATABASE_URL: string) {
        this.dbClient = drizzle(postgres(DATABASE_URL), { schema: dbSchema });
    }

    save = async (group: Group): Promise<number> => {
        const groupData = group.getData();
        const newGroup = await this.dbClient
            .insert(dbSchema.group)
            .values({
                portfolioId: groupData.portfolioId,
                name: groupData.name,
                description: groupData.description,
                createdAt: groupData.createdAt,
                updatedAt: groupData.updatedAt,
            })
            .returning()
            .execute();

        const groupId = newGroup.length !== 0 ? newGroup[0].id : undefined;

        if (groupId === undefined) {
            throw new createHttpError.InternalServerError();
        }

        return groupId;
    };

    getById = async (id: number): Promise<Group | undefined> => {
        const group = await this.dbClient.query.group.findFirst({
            where: (group, builder) => builder.eq(group.id, id),
        });

        if (!group) return undefined;

        return Group.restore({
            id: group.id,
            portfolioId: group.portfolioId,
            name: group.name,
            description: group.description,
            createdAt: group.createdAt,
            updatedAt: group.updatedAt,
        });
    };

    list = async (pagination: SeekPaginationInput): Promise<SeekPaginated<Group>> => {
        const [[countResult], groups] = await Promise.all([
            this.dbClient
                .select({ count: sql`count(*)`.mapWith(Number).as('count') })
                .from(dbSchema.group)
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
            data: groups.map((group) =>
                Group.restore({
                    id: group.id,
                    portfolioId: group.portfolioId,
                    name: group.name,
                    description: group.description,
                    createdAt: group.createdAt,
                    updatedAt: group.updatedAt,
                }),
            ),
            numberOfPages: Math.ceil(countResult.count / pagination.resultsPerPage),
            resultsPerPage: pagination.resultsPerPage,
            numberOfResults: countResult.count,
        };
    };

    listByUser = async (
        userId: number,
        pagination: SeekPaginationInput,
    ): Promise<SeekPaginated<Group>> => {
        const [[countResult], groups] = await Promise.all([
            this.dbClient
                .select({ count: sql`count(*)`.mapWith(Number).as('count') })
                .from(dbSchema.userToGroup)
                .where(eq(dbSchema.userToGroup.userId, userId))
                .execute(),
            this.dbClient
                .select({
                    group: dbSchema.group,
                })
                .from(dbSchema.group)
                .innerJoin(
                    dbSchema.userToGroup,
                    eq(dbSchema.group.id, dbSchema.userToGroup.groupId),
                )
                .where(eq(dbSchema.userToGroup.userId, userId))
                .limit(pagination.resultsPerPage)
                .offset(pagination.resultsPerPage * (pagination.page - 1))
                .execute(),
        ]);

        return {
            data: groups.map(({ group }) =>
                Group.restore({
                    id: group.id,
                    portfolioId: group.portfolioId,
                    name: group.name,
                    description: group.description,
                    createdAt: group.createdAt,
                    updatedAt: group.updatedAt,
                }),
            ),
            numberOfPages: Math.ceil(countResult.count / pagination.resultsPerPage),
            resultsPerPage: pagination.resultsPerPage,
            numberOfResults: countResult.count,
        };
    };

    listGroupPortfolioIdsByUser = async (userId: number): Promise<string[]> => {
        const groups = await this.dbClient
            .select({ portfolioId: dbSchema.group.portfolioId })
            .from(dbSchema.group)
            .innerJoin(dbSchema.userToGroup, eq(dbSchema.group.id, dbSchema.userToGroup.groupId))
            .where(eq(dbSchema.userToGroup.userId, userId))
            .execute();

        return groups.map((group) => group.portfolioId);
    };

    search = async (textQuery: string): Promise<Group[]> => {
        const groups = await this.dbClient.query.group.findMany({
            where: (group, builder) =>
                builder.or(
                    builder.ilike(group.name, `%${textQuery}%`),
                    builder.ilike(group.description, `%${textQuery}%`),
                    builder.ilike(group.portfolioId, `%${textQuery}%`),
                ),
            limit: 50,
        });

        return groups.map((group) =>
            Group.restore({
                id: group.id,
                portfolioId: group.portfolioId,
                name: group.name,
                description: group.description,
                createdAt: group.createdAt,
                updatedAt: group.updatedAt,
            }),
        );
    };

    update = async (group: Group): Promise<void> => {
        const groupData = group.getData();
        await this.dbClient
            .update(dbSchema.group)
            .set({
                portfolioId: groupData.portfolioId,
                name: groupData.name,
                description: groupData.description,
                createdAt: groupData.createdAt,
                updatedAt: groupData.updatedAt,
            })
            .where(eq(dbSchema.group.id, group.id))
            .execute();
    };

    delete = async (group: Group): Promise<void> => {
        const groupId = group.id;

        await this.dbClient
            .delete(dbSchema.userToGroup)
            .where(eq(dbSchema.userToGroup.groupId, groupId))
            .execute();

        await this.dbClient.delete(dbSchema.group).where(eq(dbSchema.group.id, groupId)).execute();
    };

    linkUsers = async (groupId: number, userIds: number[]): Promise<void> => {
        await this.dbClient
            .insert(dbSchema.userToGroup)
            .values(userIds.map((userId) => ({ userId, groupId })))
            .execute();
    };

    unlinkUsers = async (groupId: number, userIds: number[]): Promise<void> => {
        await this.dbClient
            .delete(dbSchema.userToGroup)
            .where(
                and(
                    eq(dbSchema.userToGroup.groupId, groupId),
                    inArray(dbSchema.userToGroup.userId, userIds),
                ),
            )
            .execute();
    };
}
