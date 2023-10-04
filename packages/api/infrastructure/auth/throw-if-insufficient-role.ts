import { schema } from '../repositories/protocols';
import { InsufficientRoleError } from './errors';
import { hasRoleOrAbove } from './has-role-or-above';

export const throwIfInsufficientRole = (
    minimumRole: (typeof schema.userRole.enumValues)[number],
    role: (typeof schema.userRole.enumValues)[number],
) => {
    if (!hasRoleOrAbove(minimumRole, role)) {
        throw InsufficientRoleError(minimumRole, role);
    }
};
