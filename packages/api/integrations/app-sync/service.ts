import { Sha256 } from '@aws-crypto/sha256-js';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import fetch from 'node-fetch';
import { logger } from '../powertools';

export class AppSyncIntegration {
    private AWS_REGION: string;
    private APP_SYNC_API_URL: string;

    constructor(AWS_REGION: string, APP_SYNC_API_URL: string | undefined) {
        if (APP_SYNC_API_URL === undefined) {
            throw new Error('APP_SYNC_API_URL is undefined');
        }

        this.AWS_REGION = AWS_REGION;
        this.APP_SYNC_API_URL = APP_SYNC_API_URL;
    }

    private buildMutation(username: string, data: unknown) {
        return {
            query: `#graphql
                mutation Publish($name: String!, $data: AWSJSON!) {
                    publish(name: $name, data: $data) {
                        name
                        data
                    }
                }
            `,
            variables: { name: username, data: JSON.stringify(data) },
        };
    }

    private async publishMutation(username: string, data: unknown) {
        const requestBody = this.buildMutation(username, data);
        const apiUrl = new URL(this.APP_SYNC_API_URL);

        const request = new HttpRequest({
            body: JSON.stringify(requestBody),
            headers: {
                host: apiUrl.hostname,
                'content-type': 'application/json',
            },
            hostname: apiUrl.hostname,
            method: 'POST',
            path: apiUrl.pathname,
        });

        const signer = new SignatureV4({
            credentials: defaultProvider({}),
            region: this.AWS_REGION,
            service: 'appsync',
            sha256: Sha256,
        });

        const signedRequest = await signer.sign(request);
        const response = await fetch(apiUrl, signedRequest);
        const responseBody = await response.text();
        logger.info(`AppSyncIntegration.publishMutation: ${responseBody} ${response.status}`);
    }

    async publishEc2InstanceStateChanged(username: string, instanceId: string, state: string) {
        await this.publishMutation(username, {
            type: 'EC2_INSTANCE_STATE_CHANGED',
            instanceId,
            state,
        });
    }
}
