import React from 'react';
import { useSearchParams } from 'react-router-dom';

export const usePaginationSearchParam = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Math.max(1, Number(searchParams.get('page')) || 1);

    const setPage = React.useCallback(
        (page: number) => {
            setSearchParams((prev) => {
                prev.set('page', String(page));
                return prev;
            });
        },
        [setSearchParams],
    );

    React.useEffect(() => {
        setPage(page);
    }, [page, setPage]);

    return {
        page,
        setPage,
    };
};
