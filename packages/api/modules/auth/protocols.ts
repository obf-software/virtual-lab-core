import { UserRole } from '../user/protocols';

export interface UserPoolJwtClaims {
    username: string;
    role: keyof typeof UserRole;
    userId: number;
}
