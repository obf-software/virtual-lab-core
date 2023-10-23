import createHttpError from 'http-errors';
import { Principal } from '../domain/dtos/principal';
import { Role } from '../domain/dtos/role';

export enum AuthClaimsKeys {
    USERNAME = 'USERNAME',
    ROLE = 'ROLE',
    ID = 'ID',
}

export abstract class Auth {
    private readonly roleOrder: Record<keyof typeof Role, number> = {
        NONE: 0,
        PENDING: 1,
        USER: 2,
        ADMIN: 3,
    };

    constructor(private readonly claimsKeys: Record<keyof typeof AuthClaimsKeys, string>) {}

    getUsername(principal: Principal): string {
        const username = principal.claims[this.claimsKeys.USERNAME];
        if (typeof username !== 'string') {
            throw new createHttpError.InternalServerError(`Invalid username`);
        }
        return username;
    }

    getId(principal: Principal): number {
        const id = principal.claims[this.claimsKeys.ID];
        const idAsNumber = Number(id);

        if (isNaN(idAsNumber)) {
            throw new createHttpError.InternalServerError(`Invalid id`);
        }

        return idAsNumber;
    }

    hasRoleOrAbove(principal: Principal, role: keyof typeof Role): boolean {
        const principalRoleString = principal.claims[this.claimsKeys.ROLE];

        const principalRole: keyof typeof Role = Object.keys(Role).includes(
            `${String(principalRoleString)}`,
        )
            ? (principalRoleString as keyof typeof Role)
            : 'NONE';

        return this.roleOrder[principalRole] >= this.roleOrder[role];
    }

    assertThatHasRoleOrAbove(principal: Principal, role: keyof typeof Role, error: Error): void {
        if (!this.hasRoleOrAbove(principal, role)) {
            throw error;
        }
    }
}
