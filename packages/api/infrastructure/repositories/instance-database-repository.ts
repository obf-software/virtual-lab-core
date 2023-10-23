import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { InstanceRepository } from '../../application/repositories/instance-repository';
import { SeekPaginated } from '../../domain/dtos/seek-paginated';
import { SeekPaginationInput } from '../../domain/dtos/seek-pagination-input';
import { Instance } from '../../domain/entities/instance';
import * as dbSchema from '../database/schema';
import createHttpError from 'http-errors';
import { InstanceConnectionType } from '../../domain/dtos/instance-connection-type';
import { eq, sql } from 'drizzle-orm';

export class InstanceDatabaseRepository implements InstanceRepository {
    constructor(private readonly dbClient: PostgresJsDatabase<typeof dbSchema>) {}

    save = async (instance: Instance): Promise<number> => {
        const instanceData = instance.getData();
        const newInstance = await this.dbClient
            .insert(dbSchema.instance)
            .values({
                userId: instanceData.userId,
                logicalId: instanceData.logicalId,
                provisionToken: instanceData.provisionToken,
                name: instanceData.name,
                description: instanceData.description,
                connectionType: instanceData.connectionType,
                platform: instanceData.platform,
                distribution: instanceData.description,
                instanceType: instanceData.instanceType,
                cpuCores: instanceData.cpuCores,
                memoryInGb: instanceData.memoryInGb,
                storageInGb: instanceData.storageInGb,
                createdAt: instanceData.createdAt,
                updatedAt: instanceData.updatedAt,
                lastConnectionAt: instanceData.lastConnectionAt,
            })
            .returning()
            .execute();

        const instanceId = newInstance.length !== 0 ? newInstance[0].id : undefined;

        if (instanceId === undefined) {
            throw new createHttpError.InternalServerError();
        }

        return instanceId;
    };

    getById = async (id: number): Promise<Instance | undefined> => {
        const instance = await this.dbClient.query.instance.findFirst({
            where: (instance, builder) => builder.eq(instance.id, id),
        });

        if (!instance) return undefined;

        return Instance.restore({
            id: instance.id,
            userId: instance.userId,
            logicalId: instance.logicalId,
            provisionToken: instance.provisionToken,
            name: instance.name,
            description: instance.description,
            connectionType: instance.connectionType
                ? InstanceConnectionType[instance.connectionType]
                : null,
            platform: instance.platform,
            distribution: instance.distribution,
            instanceType: instance.instanceType,
            cpuCores: instance.cpuCores,
            memoryInGb: instance.memoryInGb,
            storageInGb: instance.storageInGb,
            createdAt: instance.createdAt,
            updatedAt: instance.updatedAt,
            lastConnectionAt: instance.lastConnectionAt,
            state: null,
        });
    };

    getByLogicalId = async (logicalId: string): Promise<Instance | undefined> => {
        const instance = await this.dbClient.query.instance.findFirst({
            where: (instance, builder) => builder.eq(instance.logicalId, logicalId),
        });

        if (!instance) return undefined;

        return Instance.restore({
            id: instance.id,
            userId: instance.userId,
            logicalId: instance.logicalId,
            provisionToken: instance.provisionToken,
            name: instance.name,
            description: instance.description,
            connectionType: instance.connectionType
                ? InstanceConnectionType[instance.connectionType]
                : null,
            platform: instance.platform,
            distribution: instance.distribution,
            instanceType: instance.instanceType,
            cpuCores: instance.cpuCores,
            memoryInGb: instance.memoryInGb,
            storageInGb: instance.storageInGb,
            createdAt: instance.createdAt,
            updatedAt: instance.updatedAt,
            lastConnectionAt: instance.lastConnectionAt,
            state: null,
        });
    };

    getByProvisionToken = async (provisionToken: string): Promise<Instance | undefined> => {
        const instance = await this.dbClient.query.instance.findFirst({
            where: (instance, builder) => builder.eq(instance.provisionToken, provisionToken),
        });

        if (!instance) return undefined;

        return Instance.restore({
            id: instance.id,
            userId: instance.userId,
            logicalId: instance.logicalId,
            provisionToken: instance.provisionToken,
            name: instance.name,
            description: instance.description,
            connectionType: instance.connectionType
                ? InstanceConnectionType[instance.connectionType]
                : null,
            platform: instance.platform,
            distribution: instance.distribution,
            instanceType: instance.instanceType,
            cpuCores: instance.cpuCores,
            memoryInGb: instance.memoryInGb,
            storageInGb: instance.storageInGb,
            createdAt: instance.createdAt,
            updatedAt: instance.updatedAt,
            lastConnectionAt: instance.lastConnectionAt,
            state: null,
        });
    };

    listByUser = async (
        userId: number,
        pagination: SeekPaginationInput,
    ): Promise<SeekPaginated<Instance>> => {
        const [[countResult], instances] = await Promise.all([
            this.dbClient
                .select({ count: sql`count(*)`.mapWith(Number).as('count') })
                .from(dbSchema.instance)
                .where(eq(dbSchema.instance.userId, userId))
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
            data: instances.map((instance) =>
                Instance.restore({
                    id: instance.id,
                    userId: instance.userId,
                    logicalId: instance.logicalId,
                    provisionToken: instance.provisionToken,
                    name: instance.name,
                    description: instance.description,
                    connectionType: instance.connectionType
                        ? InstanceConnectionType[instance.connectionType]
                        : null,
                    platform: instance.platform,
                    distribution: instance.distribution,
                    instanceType: instance.instanceType,
                    cpuCores: instance.cpuCores,
                    memoryInGb: instance.memoryInGb,
                    storageInGb: instance.storageInGb,
                    createdAt: instance.createdAt,
                    updatedAt: instance.updatedAt,
                    lastConnectionAt: instance.lastConnectionAt,
                    state: null,
                }),
            ),
            numberOfPages: Math.ceil(countResult.count / pagination.resultsPerPage),
            resultsPerPage: pagination.resultsPerPage,
            numberOfResults: countResult.count,
        };
    };

    countByUser = async (userId: number): Promise<number> => {
        const countResult = await this.dbClient
            .select({ count: sql`count(*)`.mapWith(Number).as('count') })
            .from(dbSchema.instance)
            .where(eq(dbSchema.instance.userId, userId))
            .execute();

        return countResult.length !== 0 ? countResult[0].count : 0;
    };

    update = async (instance: Instance): Promise<void> => {
        const instanceData = instance.getData();
        await this.dbClient
            .update(dbSchema.instance)
            .set({
                userId: instanceData.userId,
                logicalId: instanceData.logicalId,
                provisionToken: instanceData.provisionToken,
                name: instanceData.name,
                description: instanceData.description,
                connectionType: instanceData.connectionType,
                platform: instanceData.platform,
                distribution: instanceData.description,
                instanceType: instanceData.instanceType,
                cpuCores: instanceData.cpuCores,
                memoryInGb: instanceData.memoryInGb,
                storageInGb: instanceData.storageInGb,
                createdAt: instanceData.createdAt,
                updatedAt: instanceData.updatedAt,
                lastConnectionAt: instanceData.lastConnectionAt,
            })
            .where(eq(dbSchema.instance.id, instance.id))
            .execute();
    };

    delete = async (instance: Instance): Promise<void> => {
        await this.dbClient
            .delete(dbSchema.instance)
            .where(eq(dbSchema.instance.id, instance.id))
            .execute();
    };
}
