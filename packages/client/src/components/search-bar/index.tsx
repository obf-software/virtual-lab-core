import {
    CloseButton,
    IconButton,
    Input,
    InputGroup,
    InputLeftElement,
    InputRightElement,
    Spinner,
    useDisclosure,
} from '@chakra-ui/react';
import React from 'react';
import { FiSearch } from 'react-icons/fi';

interface SearchBarProps {
    debounceMilliseconds: number;
    isHidden: boolean;
    isLoading: boolean;
    isDisabled?: boolean;
    onTextChange: (text: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    debounceMilliseconds,
    isHidden,
    isLoading,
    isDisabled,
    onTextChange,
}) => {
    const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: false });
    const [searchText, setSearchText] = React.useState('');
    const [debouncedSearchText, setDebouncedSearchText] = React.useState('');

    React.useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedSearchText(searchText);
        }, debounceMilliseconds);

        return () => {
            clearTimeout(timeout);
        };
    }, [searchText]);

    React.useEffect(() => {
        onTextChange(debouncedSearchText);
    }, [debouncedSearchText]);

    if (!isOpen) {
        return (
            <IconButton
                aria-label='Buscar'
                variant='outline'
                colorScheme='blue'
                hidden={isHidden}
                isLoading={isLoading}
                isDisabled={isDisabled}
                icon={<FiSearch />}
                onClick={onToggle}
            />
        );
    }

    return (
        <InputGroup>
            <InputLeftElement pointerEvents='none'>
                {isLoading ? (
                    <Spinner
                        size={'sm'}
                        color='gray'
                    />
                ) : (
                    <FiSearch color='gray' />
                )}
            </InputLeftElement>

            <Input
                placeholder='Buscar'
                colorScheme='blue'
                borderColor={'blue.600'}
                onChange={(event) => {
                    setSearchText(event.target.value);
                }}
            />

            <InputRightElement>
                <CloseButton
                    color={'gray'}
                    onClick={() => {
                        setSearchText('');
                        onToggle();
                    }}
                />
            </InputRightElement>
        </InputGroup>
    );
};
