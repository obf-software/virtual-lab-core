import React from 'react';
import { Group } from '../../services/api/protocols';

interface GroupPageProps {
    group: Group;
}

export const GroupPage: React.FC<GroupPageProps> = ({ group }) => {
    return <pre>{JSON.stringify(group, null, 2)}</pre>;
};
