import { z } from 'zod';

export const virtualInstanceTypeSchema = z.object({
    name: z.string(),
    cpuCores: z.string(),
    memoryInGb: z.string(),
});

export type VirtualInstanceType = z.infer<typeof virtualInstanceTypeSchema>;
