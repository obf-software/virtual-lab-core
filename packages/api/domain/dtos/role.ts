import { z } from 'zod';

export const roleSchema = z.enum(['NONE', 'PENDING', 'USER', 'ADMIN']);

export type Role = z.infer<typeof roleSchema>;
