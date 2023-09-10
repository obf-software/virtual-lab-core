import { UserRole } from '../users/protocols';

export interface UserPoolJwtClaims {
    username: string;
    role: keyof typeof UserRole;
}
