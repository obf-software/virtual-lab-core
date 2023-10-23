import { HttpRequest } from '@aws-sdk/protocol-http';
import { NotificationPublisher } from '../application/notification-publisher';
import { Notification } from '../domain/notifications/notification';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { Sha256 } from '@aws-crypto/sha256-js';
import fetch from 'node-fetch';

export class AppsyncNotificationPublisher implements NotificationPublisher {
    constructor(
        private readonly AWS_REGION: string,
        private readonly APP_SYNC_API_URL: string,
    ) {}

    private buildMutation = (username: string, data: Record<string, unknown>) => {
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
    };

    publish = async (notification: Notification): Promise<void> => {
        const requestBody = this.buildMutation(notification.username, {
            type: notification.type,
            ...notification.data,
        });
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
        await fetch(apiUrl, signedRequest);
    };
}
