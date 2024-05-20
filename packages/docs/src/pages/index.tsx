import React from 'react';
import Layout from '@theme/Layout';
import Loading from '@theme/Loading';

import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

export default function Home(): JSX.Element {
    const docsPath = 'docs/introduction';

    if (ExecutionEnvironment.canUseDOM) {
        window.location.href = docsPath;
    }

    return (
        <Layout>
            <Loading
                error={false}
                isLoading={true}
                pastDelay={true}
                timedOut={false}
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                retry={() => {}}
            />
        </Layout>
    );
}
