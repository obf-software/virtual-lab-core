import React, { Suspense } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Fallback from '@site/src/components/Fallback';

const LazyStoplight = React.lazy(() => import('../../components/Stoplight'));

export default function ApiPage(): JSX.Element {
    const {
        siteConfig: { customFields },
    } = useDocusaurusContext();

    const apiDescriptionUrl = customFields?.apiDocumentationSpecUrl as string;

    return (
        <Layout title='API Reference'>
            <BrowserOnly>
                {() => (
                    <Suspense fallback={Fallback}>
                        <LazyStoplight apiDescriptionUrl={apiDescriptionUrl} />
                    </Suspense>
                )}
            </BrowserOnly>
        </Layout>
    );
}
