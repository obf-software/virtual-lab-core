import { z } from 'zod';

export const instancePlatformSchema = z.enum(['LINUX', 'WINDOWS', 'UNKNOWN']);

export type InstancePlatform = z.infer<typeof instancePlatformSchema>;
