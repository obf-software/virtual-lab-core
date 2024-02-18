import {
    Box,
    Container,
    Heading,
    VStack,
    Text,
    Stack,
    ButtonGroup,
    IconButton,
    Spinner,
    Tooltip,
    Fade,
    SimpleGrid,
    SlideFade,
} from '@chakra-ui/react';
import { FiRefreshCw } from 'react-icons/fi';
import React, { useEffect } from 'react';
import { useMenuContext } from '../../contexts/menu/hook';
import { useInstanceTemplates } from '../../hooks/use-instance-templates';
import { InstanceTemplateCard } from '../../components/instance-template-card';

export const NewInstancePage: React.FC = () => {
    const { setActiveMenuItem } = useMenuContext();
    const { instanceTemplatesQuery } = useInstanceTemplates();

    const templates = instanceTemplatesQuery.data ?? [];
    const numberOfTemplates = templates.length;

    useEffect(() => {
        setActiveMenuItem('INSTANCES');
    }, []);

    return (
        <Box>
            <Container maxW={'6xl'}>
                <Stack
                    pb={10}
                    maxW={'6xl'}
                    direction={{ base: 'column', md: 'row' }}
                    justify={{ base: 'center', md: 'space-between' }}
                    align={{ base: 'center', md: 'center' }}
                    spacing={{ base: 5, md: 10 }}
                >
                    <SlideFade
                        in
                        offsetX={'-20px'}
                        offsetY={0}
                    >
                        <VStack
                            spacing={0}
                            align={{ base: 'center', md: 'initial' }}
                        >
                            <Heading color='gray.800'>Nova Instância</Heading>
                            <Text
                                fontSize='md'
                                color='gray.600'
                            >
                                {numberOfTemplates === 0 && 'Nenhum template disponível'}
                                {numberOfTemplates === 1 && '1 template disponível'}
                                {numberOfTemplates > 1 &&
                                    `${numberOfTemplates} templates disponíveis`}
                            </Text>
                        </VStack>
                    </SlideFade>

                    <SlideFade
                        in
                        offsetX={'20px'}
                        offsetY={0}
                    >
                        <ButtonGroup>
                            <Tooltip label='Recarregar'>
                                <IconButton
                                    aria-label='Recarregar'
                                    variant={'outline'}
                                    colorScheme='blue'
                                    hidden={instanceTemplatesQuery.isLoading}
                                    isLoading={instanceTemplatesQuery.isFetching}
                                    onClick={() => {
                                        instanceTemplatesQuery.refetch().catch(console.error);
                                    }}
                                >
                                    <FiRefreshCw />
                                </IconButton>
                            </Tooltip>
                        </ButtonGroup>
                    </SlideFade>
                </Stack>

                {numberOfTemplates === 0 && !instanceTemplatesQuery.isLoading && (
                    <Box
                        height={'50vh'}
                        display={'flex'}
                        justifyContent={'center'}
                        alignItems={'center'}
                    >
                        <Text
                            align={'center'}
                            fontSize='xl'
                            color='gray.600'
                        >
                            Nenhum template encontrado
                        </Text>
                    </Box>
                )}

                {instanceTemplatesQuery.isLoading && (
                    <Box
                        height={'50vh'}
                        display={'flex'}
                        justifyContent={'center'}
                        alignItems={'center'}
                    >
                        <Spinner
                            size={'xl'}
                            speed={'1s'}
                            thickness={'4px'}
                            color={'blue.500'}
                            emptyColor={'gray.200'}
                        />
                    </Box>
                )}

                {numberOfTemplates > 0 && !instanceTemplatesQuery.isLoading && (
                    <Box>
                        <Fade in>
                            <SimpleGrid
                                pb={10}
                                columns={{ base: 1, md: 2 }}
                                spacing={10}
                            >
                                {templates.map((template) => (
                                    <InstanceTemplateCard
                                        key={`instance-template-${template.id}-card`}
                                        instanceTemplate={template}
                                        isLoading={false}
                                        isDisabled={instanceTemplatesQuery.isFetching}
                                    />
                                ))}
                            </SimpleGrid>
                        </Fade>
                    </Box>
                )}
            </Container>
        </Box>
    );
};
