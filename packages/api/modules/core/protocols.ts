import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../drizzle/schema';

export type DatabaseClient = PostgresJsDatabase<typeof schema>;

export interface SeekPaginated<T> {
    data: T[];
    resultsPerPage: number;
    numberOfPages: number;
    numberOfResults: number;
}

export interface KeysetPaginated<T> {
    data: T[];
    numberOfResults: number;
    nextCursor: string | null;
}
