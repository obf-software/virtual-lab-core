import { eq } from 'drizzle-orm';
import * as schema from '../../drizzle/schema';
import { DatabaseClient } from '../../model/db';

export class UserRepository {
    private dbClient: DatabaseClient;

    constructor(dbClient: DatabaseClient) {
        this.dbClient = dbClient;
    }

    async create(data: typeof schema.user.$inferInsert) {
        const newUser = await this.dbClient.insert(schema.user).values(data).returning().execute();

        if (newUser.length !== 1) {
            throw new Error('Could not create user');
        }

        return newUser[0];
    }

    async exists(username: string): Promise<boolean> {
        const user = await this.dbClient.query.user.findFirst({
            where: (user, builder) => builder.eq(user.username, username),
            columns: { id: true },
        });

        return user !== null;
    }

    async updateLastLoginAt(username: string): Promise<void> {
        await this.dbClient
            .update(schema.user)
            .set({ lastLoginAt: new Date().toISOString() })
            .where(eq(schema.user.username, username))
            .execute();
    }

    async getRole(username: string) {
        const user = await this.dbClient.query.user.findFirst({
            where: (user, builder) => builder.eq(user.username, username),
            columns: { role: true },
        });

        return user?.role;
    }

    // async findById(id: string) {
    //     return this.prismaClient.user.findUnique({
    //         where: { id },
    //     });
    // }

    // async listUsers(props: {
    //     where: Prisma.UserWhereInput;
    //     take: number;
    //     cursor?: string;
    // }): Promise<Paginated<User>> {
    //     const skip = props.cursor !== undefined ? 1 : 0;
    //     const cursor: Prisma.UserWhereUniqueInput | undefined =
    //         props.cursor !== undefined ? { id: props.cursor } : undefined;

    //     const [numberOfUsers, users] = await Promise.all([
    //         this.prismaClient.user.count({
    //             where: props.where,
    //         }),
    //         this.prismaClient.user.findMany({
    //             take: props.take,
    //             skip,
    //             cursor,
    //             where: props.where,
    //             orderBy: {
    //                 createdAt: 'desc',
    //             },
    //         }),
    //     ]);

    //     return {
    //         data: users,
    //         cursor: users.length === 0 ? null : users[users.length - 1].id,
    //         totalItems: numberOfUsers,
    //     };
    // }
}
