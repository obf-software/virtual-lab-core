// import {
//     Spinner,
//     Table,
//     TableCaption,
//     TableContainer,
//     Tbody,
//     Th,
//     Thead,
//     Tr,
// } from '@chakra-ui/react';
// import React from 'react';
// import dayjs from 'dayjs';
// import relativeTime from 'dayjs/plugin/relativeTime';
// import 'dayjs/locale/pt-br';
// import { useGroupsContext } from '../../../contexts/groups/hook';
// import { GroupsTableRow } from './row';

// dayjs.extend(relativeTime);
// dayjs.locale('pt-br');

// export const GroupsTable: React.FC = () => {
//     const { isLoading, groups } = useGroupsContext();

//     return (
//         <TableContainer
//             bgColor={'white'}
//             p={4}
//             borderRadius={12}
//             boxShadow={'sm'}
//         >
//             <Table
//                 size={'md'}
//                 variant='simple'
//                 colorScheme='blue'
//             >
//                 {groups.length === 0 && isLoading === false ? (
//                     <TableCaption>Nenhum grupo encontrado</TableCaption>
//                 ) : null}

//                 {isLoading !== false ? (
//                     <TableCaption>
//                         <Spinner
//                             size='xl'
//                             speed='1s'
//                             thickness='4px'
//                             color='blue.500'
//                             emptyColor='gray.200'
//                         />
//                     </TableCaption>
//                 ) : null}

//                 <Thead>
//                     <Tr>
//                         <Th>Nome</Th>
//                         <Th>Descrição</Th>
//                         <Th>Portfólio</Th>
//                         <Th>Criado em</Th>
//                         <Th></Th>
//                     </Tr>
//                 </Thead>
//                 <Tbody>
//                     {isLoading === false &&
//                         groups.map((group, index) => (
//                             <GroupsTableRow
//                                 key={`groups-table-row-${index}`}
//                                 group={group}
//                             />
//                         ))}
//                 </Tbody>
//             </Table>
//         </TableContainer>
//     );
// };
