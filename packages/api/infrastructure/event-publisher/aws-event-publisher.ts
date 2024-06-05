import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { HttpRequest } from '@smithy/protocol-http';
import { SignatureV4 } from '@smithy/signature-v4';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { Sha256 } from '@aws-crypto/sha256-js';
import fetch from 'node-fetch';
import { Logger } from '../../application/logger';
import { EventPublisher } from '../../application/event-publisher';
import { ApplicationEvent } from '../../domain/dtos/application-event';

export class AWSEventPublisher implements EventPublisher {
    private readonly eventBridgeClient: EventBridgeClient;

    constructor(
        private readonly deps: {
            readonly logger: Logger;
            readonly AWS_REGION: string;
            readonly EVENT_BUS_NAME: string;
            readonly APP_SYNC_API_URL: string;
        },
    ) {
        this.eventBridgeClient = new EventBridgeClient({ region: deps.AWS_REGION });
    }

    private async publishToEventBridge(...events: ApplicationEvent[]): Promise<void> {
        if (events.length === 0) return;

        const command = new PutEventsCommand({
            Entries: events.map((event) => ({
                EventBusName: this.deps.EVENT_BUS_NAME,
                Source: 'virtualLabCore.api',
                DetailType: event.type,
                Detail: JSON.stringify(event.detail),
            })),
        });

        const { Entries } = await this.eventBridgeClient.send(command);

        Entries?.forEach((entry) => {
            if (entry.EventId !== undefined) {
                this.deps.logger.info(`Published event "${entry.EventId}" to AWS EventBridge`);
                return;
            }

            const error = new Error(entry.ErrorMessage);
            error.name = entry.ErrorCode ?? 'AWSEventBridgeError';

            this.deps.logger.error(`Failed to publish event to AWS EventBridge`, { error });
        });
    }

    private async publishToAppSync(...events: ApplicationEvent[]): Promise<void> {
        if (events.length === 0) return;

        const url = new URL(this.deps.APP_SYNC_API_URL);
        const signer = new SignatureV4({
            credentials: defaultProvider({}),
            region: this.deps.AWS_REGION,
            service: 'appsync',
            sha256: Sha256,
        });

        const results = await Promise.allSettled(
            events.map(async (event) => {
                const requestBody = {
                    query: `#graphql
                    mutation Publish($name: String!, $data: AWSJSON!) {
                        publish(name: $name, data: $data) {
                            name
                            data
                        }
                    }
                `,
                    variables: {
                        name: event.detail.username,
                        data: JSON.stringify({
                            type: event.type,
                            detail: event.detail,
                        }),
                    },
                };

                const request = new HttpRequest({
                    method: 'POST',
                    body: JSON.stringify(requestBody),
                    hostname: url.hostname,
                    path: url.pathname,
                    headers: {
                        host: url.hostname,
                        'Content-Type': 'application/json',
                    },
                });

                const signedRequest = await signer.sign(request);
                const response = await fetch(url, { ...signedRequest });
                const statusCode = response.status;

                if (statusCode >= 400) {
                    const error = new Error(`AWS AppSync returned status code ${statusCode}`);
                    error.name = 'AWSAppSyncError';
                    error.cause = await response.text();
                    throw error;
                }

                return {
                    username: event.detail.username,
                    type: event.type,
                    data: event.detail,
                };
            }),
        );

        results.forEach((result) => {
            if (result.status === 'fulfilled') {
                this.deps.logger.info(
                    `Published event "${result.value.type}" to AWS AppSync`,
                    result.value,
                );
                return;
            }

            const error =
                result.reason instanceof Error ? result.reason : new Error('Internal error');
            error.name = 'AWSAppSyncError';

            this.deps.logger.error(`Failed to publish event to AWS AppSync`, {
                error,
                reason: result.reason,
            });
        });
    }

    async publish(...events: ApplicationEvent[]): Promise<void> {
        const eventBridgeEvent: ApplicationEvent[] = [];
        const appSyncEvent: ApplicationEvent[] = [];

        events.forEach((event) => {
            if (!event.isValid()) {
                const error = new Error(`Event ${event.type} is not valid`);
                error.name = 'InvalidEventError';
                this.deps.logger.error(`Skipping event publishing`, { error, event });
                return;
            }

            if (event.destination === 'CLIENT') {
                appSyncEvent.push(event);
            } else if (event.destination === 'BUS') {
                eventBridgeEvent.push(event);
            } else {
                const error = new Error(`Event ${event.type} is not suposed to be published`);
                error.name = 'EventNotSupposedToBePublishedError';
                this.deps.logger.error(error.message, { error, event });
            }
        });

        await Promise.allSettled([
            this.publishToEventBridge(...eventBridgeEvent),
            this.publishToAppSync(...appSyncEvent),
        ]);
    }
}
