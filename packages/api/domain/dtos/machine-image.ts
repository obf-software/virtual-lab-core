import { z } from 'zod';
import { instancePlatformSchema } from './instance-platform';

export const machineImageSchema = z.object({
    id: z.string(),
    storageInGb: z.number(),
    platform: instancePlatformSchema,
    distribution: z.string(),
});

export type MachineImage = z.infer<typeof machineImageSchema>;
