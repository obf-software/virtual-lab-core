import React from 'react';
import { API as ApiComponent } from '@stoplight/elements';
import styles from './Stoplight.module.scss';

interface StoplightProps {
    apiDescriptionUrl: string;
}

export function Stoplight({ apiDescriptionUrl }: Readonly<StoplightProps>) {
    return (
        <div className={(styles as { stoplight: string }).stoplight}>
            <ApiComponent apiDescriptionUrl={apiDescriptionUrl} router="hash" />
        </div>
    );
}

export default Stoplight;
