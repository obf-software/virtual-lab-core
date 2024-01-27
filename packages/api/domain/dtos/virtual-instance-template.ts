import { z } from 'zod';

export const virtualInstanceTemplateSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
});

export type VirtualInstanceTemplate = z.infer<typeof virtualInstanceTemplateSchema>;
