import { z } from 'zod';
import { instanceStateSchema } from './instance-state';

export const virtualInstanceSummarySchema = z.object({
    virtualId: z.string(),
    state: instanceStateSchema,
    hostname: z.string(),
});

export type VirtualInstanceSummary = z.infer<typeof virtualInstanceSummarySchema>;
