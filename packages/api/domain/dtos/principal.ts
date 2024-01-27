import { z } from 'zod';

export const principalSchema = z.object({
    claims: z.record(z.unknown()),
});

export type Principal = z.infer<typeof principalSchema>;
