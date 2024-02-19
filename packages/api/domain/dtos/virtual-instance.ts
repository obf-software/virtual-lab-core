import { z } from 'zod';
import { instanceStateSchema } from './instance-state';

export const virtualInstanceSchema = z.object({
    virtualId: z.string(),
    state: instanceStateSchema,
    hostname: z.string(),
});

export type VirtualInstance = z.infer<typeof virtualInstanceSchema>;
