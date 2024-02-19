import { z } from 'zod';

export const virtualInstanceLaunchParametersSchema = z.object({
    instanceType: z.string(),
    canHibernate: z.boolean(),
    machineImageId: z.string(),
    storageInGb: z.number(),
});

export type VirtualInstanceLaunchParameters = z.infer<typeof virtualInstanceLaunchParametersSchema>;
