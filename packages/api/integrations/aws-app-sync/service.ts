import { Sha256 } from '@aws-crypto/sha256-js';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import fetch from 'node-fetch';
import { logger } from '../powertools';

export class AwsAppSyncIntegration {
    private AWS_REGION: string;
    private APP_SYNC_API_URL: string;

    constructor(props: { AWS_REGION: string; APP_SYNC_API_URL: string }) {
        this.AWS_REGION = props.AWS_REGION;
        this.APP_SYNC_API_URL = props.APP_SYNC_API_URL;
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
        logger.info(`AwsAppSyncIntegration.publishMutation: ${responseBody} ${response.status}`);
    }

    async publishEc2InstanceStateChanged(props: {
        username: string;
        id: number;
        awsInstanceId: string;
        name: string;
        state: string;
    }) {
        await this.publishMutation(props.username, {
            type: 'EC2_INSTANCE_STATE_CHANGED',
            id: props.id,
            awsInstanceId: props.awsInstanceId,
            name: props.name,
            state: props.state,
        });
    }
}
