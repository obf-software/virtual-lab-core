import { schema } from '../repositories/protocols';

export interface Principal {
    username: string;
    role: (typeof schema.userRole.enumValues)[number];
    userId: number;
}
