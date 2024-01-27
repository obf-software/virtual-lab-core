import { z } from 'zod';
import { instanceStateSchema } from './instance-state';

export const virtualInstanceDetailedInfoSchema = z.object({
    id: z.string(),
    state: instanceStateSchema,
    instanceType: z.string(),
    memoryInGb: z.string(),
    cpuCores: z.string(),
    distribution: z.string(),
    platform: z.string(),
    storageInGb: z.string(),
});

export type VirtualInstanceDetailedInfo = z.infer<typeof virtualInstanceDetailedInfoSchema>;
