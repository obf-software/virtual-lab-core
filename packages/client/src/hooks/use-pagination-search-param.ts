import React from 'react';
import { useSearchParams } from 'react-router-dom';

export const usePaginationSearchParam = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const orderBy = searchParams.get('orderBy') ?? undefined;
    const order = searchParams.get('order') ?? undefined;
    const page = Math.max(1, Number(searchParams.get('page')) || 1);

    const setParams = React.useCallback(
        (props: { orderBy?: string | null; order?: string | null; page: number | null }) => {
            setSearchParams((prev) => {
                if (props.orderBy === null) prev.delete('orderBy');
                else if (props.orderBy) prev.set('orderBy', props.orderBy);

                if (props.order === null) prev.delete('order');
                else if (props.order) prev.set('order', props.order);

                if (props.page === null) prev.delete('page');
                else if (props.page) prev.set('page', String(props.page));

                return prev;
            });
        },
        [setSearchParams],
    );

    React.useEffect(() => {
        setParams({ orderBy, order, page });
    }, [orderBy, order, page, setParams]);

    return {
        page,
        setParams,
    };
};
