import { schema } from '../repositories/protocols';

export const hasRoleOrAbove = (
    minimumRole: (typeof schema.userRole.enumValues)[number],
    role: (typeof schema.userRole.enumValues)[number],
) => {
    const rolePrecedenceMap: Record<(typeof schema.userRole.enumValues)[number], number> = {
        NONE: 0,
        PENDING: 1,
        USER: 2,
        ADMIN: 3,
    };
    return rolePrecedenceMap[role] >= rolePrecedenceMap[minimumRole];
};
