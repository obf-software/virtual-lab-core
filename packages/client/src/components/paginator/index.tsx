import React from 'react';
import { Box, Container, IconButton, Stack } from '@chakra-ui/react';
import { BiLeftArrowAlt, BiRightArrowAlt } from 'react-icons/bi';

interface PaginatorProps {
    activePage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export const Paginator: React.FC<PaginatorProps> = ({ activePage, totalPages, onPageChange }) => {
    const paginationButtons: number[] = [activePage];
    const buttonsAround = 1;

    for (let i = 1; i <= buttonsAround; i++) {
        if (activePage - i > 0) {
            paginationButtons.unshift(activePage - i);
        }

        if (activePage + i <= totalPages) {
            paginationButtons.push(activePage + i);
        }
    }

    const shouldDisplayDots =
        totalPages > 2 * buttonsAround + 1 &&
        paginationButtons[paginationButtons.length - 1] !== totalPages;

    return (
        <Box py={6}>
            <Container maxW={'6xl'}>
                <Stack
                    spacing={4}
                    align={'center'}
                    justify={'center'}
                    direction={'row'}
                >
                    <IconButton
                        colorScheme={'blue'}
                        isDisabled={activePage <= 1}
                        aria-label='Página anterior'
                        icon={<BiLeftArrowAlt size={'30px'} />}
                        variant={'outline'}
                        onClick={() => onPageChange(activePage - 1)}
                    />

                    {paginationButtons.map((page) => (
                        <IconButton
                            colorScheme={'blue'}
                            key={`page-${page}`}
                            aria-label={`Página ${page}`}
                            icon={<Box>{page}</Box>}
                            variant={'outline'}
                            isActive={activePage === page}
                            isDisabled={totalPages === 0}
                            onClick={() => {
                                if (activePage !== page) {
                                    onPageChange(page);
                                }
                            }}
                        />
                    ))}

                    {shouldDisplayDots && (
                        <IconButton
                            colorScheme={'blue'}
                            aria-label='...'
                            icon={<Box>...</Box>}
                            variant={'ghost'}
                            isDisabled
                        />
                    )}

                    <IconButton
                        colorScheme={'blue'}
                        isDisabled={activePage >= totalPages}
                        aria-label='Próxima página'
                        icon={<BiRightArrowAlt size={'30px'} />}
                        variant={'outline'}
                        onClick={() => onPageChange(activePage + 1)}
                    />
                </Stack>
            </Container>
        </Box>
    );
};
