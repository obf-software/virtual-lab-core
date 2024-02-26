import { FetchUserAttributesOutput, fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';
import { useEffect, useState } from 'react';
import { roleToDisplayString } from '../services/helpers';
import { Role } from '../services/api-protocols';

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
        const id = payload?.['custom:id']?.toString();

        return {
            username: username ?? '',
            role: role ?? '',
            userId: id ?? '',
            displayName: userAttributes.name ?? userAttributes.preferred_username ?? username ?? '',
            displayRole: roleToDisplayString(role as Role | undefined),
            ...userAttributes,
        };
    };

    const refetchAuthSessionData = async () => {
        const sessionData = await getAuthSessionData();
        setAuthSession(sessionData);
    };

    useEffect(() => {
        getAuthSessionData()
            .then((sessionData) => setAuthSession(sessionData))
            .catch((error) => {
                console.error('Error fetching auth session data', error);
            });
    }, []);

    return {
        authSessionData: authSession,
        refetchAuthSessionData,
    };
};
