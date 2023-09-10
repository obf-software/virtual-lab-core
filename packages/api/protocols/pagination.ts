export interface SeekPaginated<T> {
    data: T[];
    resultsPerPage: number;
    numberOfPages: number;
}

export interface KeysetPaginated<T> {
    data: T[];
    numberOfResults: number;
    nextCursor: string | null;
}
