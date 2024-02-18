import { z } from 'zod';

export const machineImageSchema = z.object({
    id: z.string(),
    storageInGb: z.number(),
});

export type MachineImage = z.infer<typeof machineImageSchema>;
