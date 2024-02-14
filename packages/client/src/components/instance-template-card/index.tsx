import { Button, Card, CardBody, CardFooter, CardHeader, Heading } from '@chakra-ui/react';
import React from 'react';
import { FiPlus } from 'react-icons/fi';
import { InstanceTemplate } from '../../services/api-protocols';

interface InstanceTemplateCardProps {
    instanceTemplate: InstanceTemplate;
    isLoading?: boolean;
    isDisabled?: boolean;
    onProvision?: () => void;
}

export const InstanceTemplateCard: React.FC<InstanceTemplateCardProps> = ({
    instanceTemplate,
    isLoading,
    isDisabled,
    onProvision,
}) => {
    return (
        <Card
            borderRadius='xl'
            boxShadow='md'
            overflow='hidden'
            width={{ base: '100%' }}
            p={4}
            margin='auto'
        >
            <CardHeader textAlign='center'>
                <Heading
                    size='lg'
                    noOfLines={2}
                >
                    {instanceTemplate.name}
                </Heading>
            </CardHeader>

            <CardBody textAlign={'center'}>
                <Heading
                    size={'md'}
                    color={'gray.600'}
                    noOfLines={3}
                >
                    {instanceTemplate.description}
                </Heading>
            </CardBody>

            <CardFooter justifyContent='center'>
                <Button
                    leftIcon={<FiPlus />}
                    colorScheme='blue'
                    isLoading={isLoading}
                    isDisabled={isDisabled}
                    onClick={onProvision}
                >
                    Criar a partir deste template
                </Button>
            </CardFooter>
        </Card>
    );
};
