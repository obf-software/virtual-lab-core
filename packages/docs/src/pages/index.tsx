import Link from '@docusaurus/Link';
import React from 'react';
import Layout from '@theme/Layout';

import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import styles from './index.module.css';

export default function Home(): JSX.Element {
    const docsPath = 'docs/introduction';

    if (ExecutionEnvironment.canUseDOM) {
        window.location.href = docsPath;
    }

    return (
        <Layout>
            <div className={styles.redirectContainer}>
                <Link
                    className='button button--primary button--lg'
                    to={docsPath}
                >
                    Redirecionando para a documentação...
                </Link>
            </div>
        </Layout>
    );
}
