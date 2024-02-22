import { FetchUserAttributesOutput, fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';
import { useEffect, useState } from 'react';
import { roleToDisplayString } from '../services/helpers';

type AuthSessionData = {
    username: string;
    role: string;
    userId: string;
    displayName: string;
    displayRole: string;
} & FetchUserAttributesOutput;

export const useAuthSessionData = () => {
    const [authSession, setAuthSession] = useState<AuthSessionData>();

    const getAuthSessionData = async (): Promise<AuthSessionData> => {
        const authSession = await fetchAuthSession();
        const payload = authSession.tokens?.idToken?.payload;
        const userAttributes = await fetchUserAttributes();

        const username = payload?.['cognito:username']?.toString();
        const role = payload?.['custom:role']?.toString();
        const userId = payload?.['custom:userId']?.toString();

        return {
            username: username ?? '',
            role: role ?? '',
            userId: userId ?? '',
            displayName: userAttributes.name ?? userAttributes.preferred_username ?? username ?? '',
            displayRole: roleToDisplayString(role ?? ''),
            ...userAttributes,
        };
    };

    useEffect(() => {
        getAuthSessionData()
            .then((sessionData) => setAuthSession(sessionData))
            .catch((error) => {
                console.error('Error fetching auth session data', error);
            });
    }, []);

    return authSession;
};