import { z } from 'zod';
import { instancePlatformSchema } from './instance-platform';
import { machineImageStateSchema } from './machine-image-state';

export const machineImageSchema = z.object({
    id: z.string(),
    storageInGb: z.number(),
    platform: instancePlatformSchema,
    distribution: z.string(),
    state: machineImageStateSchema,
});

export type MachineImage = z.infer<typeof machineImageSchema>;
