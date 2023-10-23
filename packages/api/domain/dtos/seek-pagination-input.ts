import { z } from 'zod';

const seekPaginationInput = z.object({
    page: z.number().int().min(1).default(1),
    resultsPerPage: z.number().int().min(1).default(10),
});

export type SeekPaginationInput = z.infer<typeof seekPaginationInput>;
