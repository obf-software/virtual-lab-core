import { z } from 'zod';

export const machineImageStateSchema = z.enum([
    'AVAILABLE',
    'DEREGISTERED',
    'DISABLED',
    'ERROR',
    'FAILED',
    'INVALID',
    'PENDING',
    'TRANSIENT',
]);

export type MachineImageState = z.infer<typeof machineImageStateSchema>;
