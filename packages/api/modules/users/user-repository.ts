import { Prisma, PrismaClient, User } from '@prisma/client';
import { Paginated } from '../../model/paginated';

export class UserRepository {
    private prismaClient: PrismaClient;

    constructor(prismaClient: PrismaClient) {
        this.prismaClient = prismaClient;
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
