import React from 'react';
import { useSearchParams } from 'react-router-dom';

export const useUserIdSearchParam = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const userId = searchParams.get('userId') ?? 'me';

    const setUserId = React.useCallback(
        (userId: number | 'me') => {
            setSearchParams((prev) => {
                prev.set('userId', String(userId));
                return prev;
            });
        },
        [setSearchParams],
    );

    React.useEffect(() => {
        const parsedUserId = Number(userId);

        if (userId === 'me' || Number.isNaN(parsedUserId)) {
            setUserId('me');
        } else {
            setUserId(parsedUserId);
        }
    }, [userId, setUserId]);

    return {
        userId,
        setUserId,
    };
};
