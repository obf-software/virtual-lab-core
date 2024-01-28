import { z } from 'zod';

export const virtualInstanceLaunchParametersSchema = z.object({
    instanceType: z.string(),
    enableHibernation: z.boolean(),
});

export type VirtualInstanceLaunchParameters = z.infer<typeof virtualInstanceLaunchParametersSchema>;
