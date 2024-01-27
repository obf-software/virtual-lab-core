import { z } from 'zod';

export const instanceStateSchema = z.enum([
    'PENDING',
    'RUNNING',
    'STOPPING',
    'STOPPED',
    'SHUTTING_DOWN',
    'TERMINATED',
]);

export type InstanceState = z.infer<typeof instanceStateSchema>;
