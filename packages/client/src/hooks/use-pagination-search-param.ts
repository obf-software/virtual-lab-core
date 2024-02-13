import React from 'react';
import { useSearchParams } from 'react-router-dom';

export const usePaginationSearchParam = <T extends string, K extends 'asc' | 'desc'>(props?: {
    allowedOrderByValues?: T[];
    defaultOrderBy?: T;
    allowedOrderValues?: K[];
    defaultOrder?: K;
    defaultPage?: number;
    defaultResultsPerPage?: number;
}) => {
    const [searchParams, setSearchParams] = useSearchParams();

    const orderByText = searchParams.get('orderBy') ?? props?.defaultOrderBy;
    const orderBy = props?.allowedOrderByValues?.includes(orderByText as T)
        ? orderByText
        : props?.defaultOrderBy;

    const orderText = searchParams.get('order') ?? props?.defaultOrder;
    const order = props?.allowedOrderValues?.includes(orderText as K)
        ? orderText
        : props?.defaultOrder;

    const pageString = searchParams.get('page');
    const page =
        pageString && !Number.isNaN(Number(pageString))
            ? Math.max(1, Number(pageString))
            : props?.defaultPage ?? 1;

    const resultsPerPageString = searchParams.get('resultsPerPage');
    const resultsPerPage =
        resultsPerPageString && !Number.isNaN(Number(resultsPerPageString))
            ? Math.min(60, Math.max(1, Number(resultsPerPageString)))
            : props?.defaultResultsPerPage ?? 10;

    const setParams = React.useCallback(
        (data: {
            orderBy?: T | null;
            order?: K | null;
            page?: number | null;
            resultsPerPage?: number | null;
        }) => {
            setSearchParams((prev) => {
                if (data.orderBy === null) prev.delete('orderBy');
                else if (data.orderBy) prev.set('orderBy', data.orderBy);

                if (data.order === null) prev.delete('order');
                else if (data.order) prev.set('order', data.order);

                if (data.page === null) prev.delete('page');
                else if (data.page) prev.set('page', String(data.page));

                if (data.resultsPerPage === null) prev.delete('resultsPerPage');
                else if (data.resultsPerPage)
                    prev.set('resultsPerPage', String(data.resultsPerPage));

                return prev;
            });
        },
        [setSearchParams],
    );

    React.useEffect(() => {
        setParams({
            orderBy: orderBy as T | null,
            order: order as K | null,
            page,
            resultsPerPage,
        });
    }, [orderBy, order, page, resultsPerPage, setParams]);

    return {
        orderBy: orderBy as T | undefined,
        order: order as K | undefined,
        page,
        resultsPerPage,
        setParams,
    };
};
