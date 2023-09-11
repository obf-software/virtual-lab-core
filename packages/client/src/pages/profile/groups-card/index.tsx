import { Heading, VStack } from '@chakra-ui/react';
import React from 'react';
import { ProfileGroupsCardTable } from './table';

export const ProfileGroupsCard: React.FC = () => {
    return (
        <VStack
            align={'start'}
            pb={10}
        >
            <Heading
                size={'lg'}
                color='gray.800'
            >
                Grupos
            </Heading>

            <ProfileGroupsCardTable />
        </VStack>
    );
};
