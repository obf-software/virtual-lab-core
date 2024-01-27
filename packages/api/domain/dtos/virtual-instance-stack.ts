import { z } from 'zod';
import { instanceConnectionTypeSchema } from './instance-connection-type';

export const virtualInstanceStackSchema = z.object({
    instanceId: z.string(),
    connectionType: instanceConnectionTypeSchema,
    launchToken: z.string(),
});

export type VirtualInstanceStack = z.infer<typeof virtualInstanceStackSchema>;
