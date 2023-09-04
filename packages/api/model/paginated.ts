export type Paginated<T> = {
    data: T[];
    totalItems: number | null;
    cursor: string | null;
};
