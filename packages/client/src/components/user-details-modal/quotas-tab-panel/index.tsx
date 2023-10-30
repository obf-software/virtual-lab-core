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
import * as api from '../../../services/api/service';
import { Role, User } from '../../../services/api/protocols';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '../../../services/query/service';
import { getErrorMessage, parseSessionData } from '../../../services/helpers';
import { useAuthenticator } from '@aws-amplify/ui-react';

interface UserDetailsModalQuotasTabPanelProps {
    user: User;
}

export const UserDetailsModalQuotasTabPanel: React.FC<UserDetailsModalQuotasTabPanelProps> = ({
    user,
}) => {
    const { user: amplifyUser } = useAuthenticator((context) => [context.user]);
    const { userId } = parseSessionData(amplifyUser);
    const toast = useToast();
    const [maxInstances, setMaxInstances] = React.useState(user.maxInstances);
    const [maxInstancesDebounce, setMaxInstancesDebounce] = React.useState(user.maxInstances);

    const updateUserQuotasMutation = useMutation({
        mutationFn: async (mut: { userId: number | 'me'; maxInstances: number }) => {
            const { data, error } = await api.updateUserQuotas(user.id, mut.maxInstances);
            if (error !== undefined) throw new Error(error);
            return { mut, data };
        },
        onSuccess: ({ mut }) => {
            queryClient.invalidateQueries(['user', mut.userId]).catch(console.error);
            queryClient.invalidateQueries(['users']).catch(console.error);
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
                isRequired={user.id !== userId && user.role !== Role.ADMIN}
                isReadOnly={user.id === userId || user.role === Role.ADMIN}
            >
                <FormLabel htmlFor='role'>Número máximo de instâncias</FormLabel>

                <InputGroup>
                    <Input
                        id='role'
                        value={user.id === userId || user.role === Role.ADMIN ? '-' : maxInstances}
                        onChange={(event) => {
                            const value = parseInt(event.target.value);
                            if (value >= 0 && value !== user.maxInstances) {
                                setMaxInstances(value);
                            }
                        }}
                    />
                    <InputRightElement>
                        {updateUserQuotasMutation.isLoading ? <Spinner size='sm' /> : null}
                    </InputRightElement>
                </InputGroup>

                <FormHelperText>
                    {user.id === userId
                        ? 'Administradores não possuem um númeor máximo de instâncias'
                        : ''}
                </FormHelperText>
            </FormControl>
        </TabPanel>
    );
};
