import { Auth } from '../../application/auth';
import { Principal } from '../../domain/dtos/principal';
import { Role } from '../../domain/dtos/role';
import { ObjectId } from 'mongodb';
import { randomUUID } from 'node:crypto';

export class InMemoryAuth extends Auth {
    constructor() {
        super({
            username: 'username',
            role: 'role',
            id: 'userId',
        });
    }

    static readonly createTestUserPrincipal = (data: {
        username?: string;
        role?: Role;
        userId?: string;
    }): Principal => ({
        claims: {
            username: data.username ?? randomUUID(),
            role: data.role ?? 'NONE',
            userId: data.userId ?? new ObjectId().toJSON(),
        },
    });
}
