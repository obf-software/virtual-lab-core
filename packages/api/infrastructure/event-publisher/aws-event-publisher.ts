import {
    EventBridgeClient,
    PutEventsCommand,
    PutEventsResultEntry,
} from '@aws-sdk/client-eventbridge';
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
            readonly AWS_EVENT_BUS_NAME: string;
            readonly AWS_APPSYNC_API_URL: string;
        },
    ) {
        this.eventBridgeClient = new EventBridgeClient({ region: deps.AWS_REGION });
    }

    private async publishToEventBridge(...events: ApplicationEvent[]): Promise<void> {
        if (events.length === 0) return;

        const command = new PutEventsCommand({
            Entries: events.map((event) => ({
                EventBusName: this.deps.AWS_EVENT_BUS_NAME,
                Source: 'virtualLabCore.api',
                DetailType: event.type,
                Detail: JSON.stringify(event.detail),
            })),
        });

        const { Entries } = await this.eventBridgeClient.send(command);

        const failEntries: PutEventsResultEntry[] = [];
        const successEntries: PutEventsResultEntry[] = [];

        Entries?.forEach((entry) => {
            if (entry.ErrorCode === undefined) {
                successEntries.push(entry);
            } else {
                failEntries.push(entry);
            }
        });

        if (failEntries.length > 0) {
            this.deps.logger.error(`Error publishing events to AWS EventBridge`, { failEntries });
        }

        if (successEntries.length > 0) {
            this.deps.logger.info(`Successfully published events to AWS EventBridge`, {
                successEntries,
            });
        }
    }

    private async publishToAppSync(...events: ApplicationEvent[]): Promise<void> {
        if (events.length === 0) return;

        const url = new URL(this.deps.AWS_APPSYNC_API_URL);
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
                return {
                    requestBody,
                    statusCode: response.status,
                    responseBody: await response.text(),
                };
            }),
        );

        const failResults: { requestBody: unknown; statusCode: number; responseBody: string }[] =
            [];
        const successResults: { requestBody: unknown; statusCode: number; responseBody: string }[] =
            [];

        results.forEach((result) => {
            if (result.status === 'fulfilled') {
                if (result.value.statusCode >= 200 && result.value.statusCode < 399) {
                    successResults.push(result.value);
                } else {
                    failResults.push(result.value);
                }
            } else {
                this.deps.logger.error(`Error calling AWS AppSync`, { error: result.reason });
            }
        });

        if (failResults.length > 0) {
            this.deps.logger.error(`Error publishing events to AWS AppSync`, { failResults });
        }

        if (successResults.length > 0) {
            this.deps.logger.info(`Successfully published events to AWS AppSync`, {
                successResults,
            });
        }
    }

    async publish(...events: ApplicationEvent[]): Promise<void> {
        const eventBridgeEvent: ApplicationEvent[] = [];
        const appSyncEvent: ApplicationEvent[] = [];

        events.forEach((event) => {
            if (!event.isValid()) {
                this.deps.logger.error(
                    `Event ${event.type} is not valid: ${JSON.stringify(
                        event.detail,
                    )}. Not publishing.`,
                );

                return;
            }

            if (event.destination === 'CLIENT') {
                appSyncEvent.push(event);
            } else if (event.destination === 'BUS') {
                eventBridgeEvent.push(event);
            } else {
                this.deps.logger.error(
                    `Event ${event.type} is not suposed to be published. Not publishing.`,
                );
            }
        });

        await Promise.allSettled([
            this.publishToEventBridge(...eventBridgeEvent),
            this.publishToAppSync(...appSyncEvent),
        ]);
    }
}
