import { Prisma, PrismaClient, User, UserRole } from '@prisma/client';
import { Paginated } from '../../model/paginated';

export class UserRepository {
    private prismaClient: PrismaClient;

    constructor(prismaClient: PrismaClient) {
        this.prismaClient = prismaClient;
    }

    async create(props: Pick<User, 'username' | 'role' | 'groupIds'>): Promise<User> {
        const newUser = this.prismaClient.user.create({
            data: {
                username: props.username,
                role: props.role,
                quotas: {
                    maxGroups: 100,
                    maxInstances: 2,
                },
                groups:
                    props.groupIds.length > 0
                        ? { connect: props.groupIds.map((groupId) => ({ id: groupId })) }
                        : undefined,
            },
        });

        return newUser;
    }

    async exists(username: string): Promise<boolean> {
        const result = await this.prismaClient.user.findUnique({
            where: { username },
            select: {
                username: true,
            },
        });

        return result !== null;
    }

    async updateLastLoginAt(username: string): Promise<void> {
        await this.prismaClient.user.update({
            where: { username },
            data: { lastLoginAt: new Date().toISOString() },
        });
    }

    async getRole(username: string): Promise<UserRole | undefined> {
        const user = await this.prismaClient.user.findUnique({
            where: { username },
            select: {
                role: true,
            },
        });

        return user?.role;
    }

    async findById(id: string) {
        return this.prismaClient.user.findUnique({
            where: { id },
        });
    }

    async listUsers(props: {
        where: Prisma.UserWhereInput;
        take: number;
        cursor?: string;
    }): Promise<Paginated<User>> {
        const skip = props.cursor !== undefined ? 1 : 0;
        const cursor: Prisma.UserWhereUniqueInput | undefined =
            props.cursor !== undefined ? { id: props.cursor } : undefined;

        const [numberOfUsers, users] = await Promise.all([
            this.prismaClient.user.count({
                where: props.where,
            }),
            this.prismaClient.user.findMany({
                take: props.take,
                skip,
                cursor,
                where: props.where,
                orderBy: {
                    createdAt: 'desc',
                },
            }),
        ]);

        return {
            data: users,
            cursor: users.length === 0 ? null : users[users.length - 1].id,
            totalItems: numberOfUsers,
        };
    }
}
