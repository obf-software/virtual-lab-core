import React from 'react';
import { useSearchParams } from 'react-router-dom';

export const useUserIdSearchParam = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const userId = searchParams.get('userId') ?? 'me';

    const setUserId = React.useCallback(
        (userId: string) => {
            setSearchParams((prev) => {
                prev.set('userId', userId);
                return prev;
            });
        },
        [setSearchParams],
    );

    React.useEffect(() => {
        setUserId(userId);
    }, [userId, setUserId]);

    return {
        userId,
        setUserId,
    };
};
