import { z } from 'zod';

export const virtualInstanceLaunchParametersSchema = z.object({
    instanceType: z.string(),
});

export type VirtualInstanceLaunchParameters = z.infer<typeof virtualInstanceLaunchParametersSchema>;
