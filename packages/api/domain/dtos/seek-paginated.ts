import { z } from 'zod';

export interface SeekPaginated<T> {
    data: T[];
    resultsPerPage: number;
    numberOfPages: number;
    numberOfResults: number;
}

export const seekPaginationInputSchema = z.object({
    page: z.number({ coerce: true }).int().min(1).default(1),
    resultsPerPage: z.number({ coerce: true }).int().min(1).max(60).default(10),
});

export type SeekPaginationInput = z.infer<typeof seekPaginationInputSchema>;
