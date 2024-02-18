import { z } from 'zod';

export const productSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
});

export type Product = z.infer<typeof productSchema>;
