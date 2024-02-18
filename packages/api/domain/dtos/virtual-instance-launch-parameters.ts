import { z } from 'zod';

export const virtualInstanceLaunchParametersSchema = z.object({
    instanceType: z.string(),
    enableHibernation: z.boolean(),
    machineImageId: z.string(),
    storageInGb: z.number(),
});

export type VirtualInstanceLaunchParameters = z.infer<typeof virtualInstanceLaunchParametersSchema>;
