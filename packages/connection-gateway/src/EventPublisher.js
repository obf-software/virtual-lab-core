const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');

class EventPublisher {
    constructor(logger) {
        this.logger = logger;
    }

    publishConnectionStartedEvent = (virtualId) => {
        if (!virtualId) {
            this.logger.error('Cannot publish connection started event without virtualId');
            return;
        }

        this.publish('INSTANCE_CONNECTION_STARTED', { virtualId })
            .then(() => {
                this.logger.info(`Connection started for virtualId: ${virtualId}`);
            })
            .catch((error) => {
                this.logger.error(
                    `Error publishing connection started event for virtualId: ${virtualId}`,
                    { error },
                );
            });
    };

    publishConnectionEndedEvent = (virtualId) => {
        if (!virtualId) {
            this.logger.error('Cannot publish connection started event without virtualId');
            return;
        }

        this.publish('INSTANCE_CONNECTION_ENDED', { virtualId })
            .then(() => {
                this.logger.info(`Connection ended for virtualId: ${virtualId}`);
            })
            .catch((error) => {
                this.logger.error(
                    `Error publishing connection ended event for virtualId: ${virtualId}`,
                    { error },
                );
            });
    };

    publish = async (detailType, detail) => {
        const eventBridgeClient = new EventBridgeClient({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                sessionToken: process.env.AWS_SESSION_TOKEN,
            },
        });

        await eventBridgeClient.send(
            new PutEventsCommand({
                Entries: [
                    {
                        DetailType: detailType,
                        Detail: JSON.stringify(detail),
                        EventBusName: process.env.VL_EVENT_BUS_ARN,
                        Source: 'connection-gateway',
                    },
                ],
            }),
        );
    };
}

module.exports = EventPublisher;
