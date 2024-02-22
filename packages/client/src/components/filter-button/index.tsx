import {
    Button,
    Heading,
    IconButton,
    Popover,
    PopoverArrow,
    PopoverBody,
    PopoverCloseButton,
    PopoverContent,
    PopoverFooter,
    PopoverHeader,
    PopoverTrigger,
    Radio,
    RadioGroup,
    Stack,
    VStack,
    useDisclosure,
} from '@chakra-ui/react';
import React from 'react';
import { FiSliders } from 'react-icons/fi';

interface FilterContent<K extends string> {
    label: string;
    values: { label: string; value: K }[];
    selectedValue: K;
}

interface FilterButtonProps<
    K extends string = string,
    T extends Record<string, FilterContent<K>> = Record<string, FilterContent<K>>,
> {
    hidden?: boolean;
    filters: T;
    onFiltersChange: (filters: T) => void;
}

export const FilterButton: React.FC<FilterButtonProps> = ({ hidden, filters, onFiltersChange }) => {
    const { isOpen, onClose, onOpen } = useDisclosure();
    const [selectedFilters, setSelectedFilters] = React.useState(filters);

    React.useEffect(() => {
        setSelectedFilters(filters);
    }, [filters]);

    return (
        <Popover
            placement='bottom'
            isOpen={isOpen}
            onClose={() => {
                setSelectedFilters(filters);
                onClose();
            }}
        >
            <PopoverTrigger>
                <IconButton
                    icon={<FiSliders />}
                    hidden={hidden}
                    aria-label='Filtrar'
                    variant={'outline'}
                    colorScheme='blue'
                    onClick={onOpen}
                />
            </PopoverTrigger>

            <PopoverContent
                px={4}
                py={2}
                w={'auto'}
            >
                <PopoverCloseButton size={'lg'} />
                <PopoverArrow />

                <PopoverHeader>
                    <Heading size={'md'}>Filtros</Heading>
                </PopoverHeader>

                <PopoverBody>
                    {Object.entries(filters).map(([key, filter]) => (
                        <VStack
                            key={key}
                            align='flex-start'
                            spacing={4}
                        >
                            <Heading
                                mt={'5%'}
                                size={'sm'}
                            >
                                {filter.label}
                            </Heading>

                            <RadioGroup value={selectedFilters[key].selectedValue}>
                                <Stack>
                                    {filter.values.map((value) => (
                                        <Radio
                                            key={value.value}
                                            value={value.value}
                                            onChange={(e) => {
                                                setSelectedFilters((prev) => ({
                                                    ...prev,
                                                    [key]: {
                                                        ...prev[key],
                                                        selectedValue: e.target.value,
                                                    },
                                                }));
                                            }}
                                        >
                                            {value.label}
                                        </Radio>
                                    ))}
                                </Stack>
                            </RadioGroup>
                        </VStack>
                    ))}
                </PopoverBody>

                <PopoverFooter
                    alignItems={'center'}
                    justifyContent={'center'}
                    display={'flex'}
                >
                    <Button
                        mt={2}
                        colorScheme='blue'
                        onClick={() => {
                            onFiltersChange(selectedFilters);
                            onClose();
                        }}
                    >
                        Aplicar
                    </Button>
                </PopoverFooter>
            </PopoverContent>
        </Popover>
    );
};
