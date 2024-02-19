import { Principal } from '../domain/dtos/principal';
import { Role, roleSchema } from '../domain/dtos/role';
import { z } from 'zod';
import { Errors } from '../domain/dtos/errors';

export const authClaimsKeysSchema = z.enum(['username', 'role', 'id']);

export type AuthClaimsKeys = z.infer<typeof authClaimsKeysSchema>;

export abstract class Auth {
    private readonly roleOrder: Record<Role, number> = {
        NONE: 2 << 0,
        PENDING: 2 << 1,
        USER: 2 << 2,
        ADMIN: 2 << 3,
    };

    constructor(private readonly claimsKeys: Record<AuthClaimsKeys, string>) {}

    getClaims = (principal: Principal) => ({
        username: this.getUsername(principal),
        id: this.getId(principal),
        role: this.getRole(principal),
    });

    private getUsername = (principal: Principal): string => {
        const username = principal.claims[this.claimsKeys.username];
        if (typeof username !== 'string') throw Errors.unauthorizedPrincipal('Invalid username');
        return username;
    };

    private getRole = (principal: Principal): Role => {
        const roleString = principal.claims[this.claimsKeys.role];
        const validation = roleSchema.default('NONE').safeParse(roleString);
        if (!validation.success) throw Errors.unauthorizedPrincipal('Invalid role');
        return validation.data;
    };

    private getId = (principal: Principal): string => {
        const id = principal.claims[this.claimsKeys.id];
        if (typeof id !== 'string') throw Errors.unauthorizedPrincipal('Invalid id');
        return id;
    };

    hasRoleOrAbove(principal: Principal, role: Role): boolean {
        const principalRole = this.getRole(principal);
        return this.roleOrder[principalRole] >= this.roleOrder[role];
    }

    assertThatHasRoleOrAbove(principal: Principal, role: Role): void {
        if (!this.hasRoleOrAbove(principal, role)) {
            throw Errors.insufficientRole(role);
        }
    }
}
