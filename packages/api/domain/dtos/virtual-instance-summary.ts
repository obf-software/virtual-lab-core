import { z } from 'zod';
import { instanceStateSchema } from './instance-state';

export const virtualInstanceSummarySchema = z.object({
    id: z.string(),
    state: instanceStateSchema,
    hostname: z.string(),
});

export type VirtualInstanceSummary = z.infer<typeof virtualInstanceSummarySchema>;
