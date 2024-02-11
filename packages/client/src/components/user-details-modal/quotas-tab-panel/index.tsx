/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import {
    TabPanel,
    Input,
    useToast,
    FormControl,
    FormLabel,
    FormHelperText,
    InputGroup,
    InputRightElement,
    Spinner,
} from '@chakra-ui/react';
import React from 'react';
import * as api from '../../../services/api';
import { User } from '../../../services/api-protocols';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '../../../services/query-client';
import { getErrorMessage } from '../../../services/helpers';
import { useAuthSessionData } from '../../../hooks/use-auth-session-data';

interface UserDetailsModalQuotasTabPanelProps {
    user: User;
}

export const UserDetailsModalQuotasTabPanel: React.FC<UserDetailsModalQuotasTabPanelProps> = ({
    user,
}) => {
    const authSessionData = useAuthSessionData();
    const toast = useToast();
    const [maxInstances, setMaxInstances] = React.useState(user.quotas.maxInstances);
    const [maxInstancesDebounce, setMaxInstancesDebounce] = React.useState(
        user.quotas.maxInstances,
    );

    const updateUserQuotasMutation = useMutation({
        mutationFn: async (mut: { userId: string | 'me'; maxInstances: number }) => {
            const response = await api.updateUserQuotas({
                userId: mut.userId,
                maxInstances: mut.maxInstances,
            });
            if (!response.success) throw new Error(response.error);
            return { mut, data: response.data };
        },
        onSuccess: ({ mut }) => {
            queryClient.invalidateQueries({ queryKey: ['user', mut.userId] }).catch(console.error);
            queryClient.invalidateQueries({ queryKey: ['users'] }).catch(console.error);
        },
        onError: (error) => {
            toast({
                title: 'Erro ao atualizar quotas',
                description: getErrorMessage(error),
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        },
    });

    React.useEffect(() => {
        const timeout = setTimeout(() => {
            if (maxInstancesDebounce !== maxInstances) {
                updateUserQuotasMutation.mutate({
                    userId: user.id,
                    maxInstances,
                });
                setMaxInstancesDebounce(maxInstances);
            }
        }, 1000);
        return () => clearTimeout(timeout);
    }, [maxInstances, maxInstancesDebounce, updateUserQuotasMutation, user.id]);

    return (
        <TabPanel>
            <FormControl
                mt={'2%'}
                isRequired={user.id !== authSessionData?.userId && user.role !== 'ADMIN'}
                isReadOnly={user.id === authSessionData?.userId || user.role === 'ADMIN'}
            >
                <FormLabel htmlFor='role'>Número máximo de instâncias</FormLabel>

                <InputGroup>
                    <Input
                        id='role'
                        value={
                            user.id === authSessionData?.userId || user.role === 'ADMIN'
                                ? '-'
                                : maxInstances
                        }
                        onChange={(event) => {
                            const value = parseInt(event.target.value);
                            if (value >= 0 && value !== user.quotas.maxInstances) {
                                setMaxInstances(value);
                            }
                        }}
                    />
                    <InputRightElement>
                        {updateUserQuotasMutation.isPending ? <Spinner size='sm' /> : null}
                    </InputRightElement>
                </InputGroup>

                <FormHelperText>
                    {user.id === authSessionData?.userId
                        ? 'Administradores não possuem um númeor máximo de instâncias'
                        : ''}
                </FormHelperText>
            </FormControl>
        </TabPanel>
    );
};
