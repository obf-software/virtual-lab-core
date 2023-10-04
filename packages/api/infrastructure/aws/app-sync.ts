import { Sha256 } from '@aws-crypto/sha256-js';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import fetch from 'node-fetch';
import * as schema from '../drizzle/schema';
import { Logger } from '@aws-lambda-powertools/logger';

export class AppSync {
    constructor(
        private readonly AWS_REGION: string,
        private readonly APP_SYNC_API_URL: string,
        private readonly logger: Logger,
    ) {}

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

    async publishMutation(username: string, data: unknown) {
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
        this.logger.info(
            `AwsAppSyncIntegration.publishMutation: ${responseBody} ${response.status}`,
        );
    }

    /**
     * @deprecated Move away from here. Keep infrastructure code generic
     */
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

    /**
     * @deprecated Move away from here. Keep infrastructure code generic
     */
    async publishEc2InstanceProvisioned(props: {
        username: string;
        instance: typeof schema.instance.$inferSelect;
    }) {
        await this.publishMutation(props.username, {
            type: 'EC2_INSTANCE_PROVISIONED',
            instance: props.instance,
        });
    }
}
