import { z } from 'zod';

export const instanceConnectionTypeSchema = z.enum(['RDP', 'VNC']);

export type InstanceConnectionType = z.infer<typeof instanceConnectionTypeSchema>;
