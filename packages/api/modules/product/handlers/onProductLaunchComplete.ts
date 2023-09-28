import { SNSHandler } from 'aws-lambda';
import { createHandler } from '../../../integrations/powertools';

/**
 * StackId='arn:aws:cloudformation:us-east-1:154317023037:stack/SC-154317023037-pp-kka5k6yluzrdg/9aae5050-5e4a-11ee-8983-0aaa8356ff9f'
 * Timestamp='2023-09-28T22:04:31.607Z'
 * EventId='00551c40-5e4b-11ee-a58b-0ad65c6599e9'
 * LogicalResourceId='SC-154317023037-pp-kka5k6yluzrdg'
 * Namespace='154317023037'
 * PhysicalResourceId='arn:aws:cloudformation:us-east-1:154317023037:stack/SC-154317023037-pp-kka5k6yluzrdg/9aae5050-5e4a-11ee-8983-0aaa8356ff9f'
 * PrincipalId='AIDASH3QC446RTORJGVLW'
 * ResourceProperties='null'
 * ResourceStatus='CREATE_COMPLETE'
 * ResourceStatusReason=''
 * ResourceType='AWS::CloudFormation::Stack'
 * StackName='SC-154317023037-pp-kka5k6yluzrdg'
 * ClientRequestToken='b6ef1b25-a648-44b6-b426-1b6100e7d903'
 */
interface ParsedMessage {
    stackId?: string;
    timestamp?: string;
    resourceStatus?: string;
    resourceType?: string;
    clientRequestToken?: string;
}

const parseMessage = (
    rawMessage: string,
    mapper: Record<keyof ParsedMessage, string>,
): ParsedMessage => {
    const parsedMessage: ParsedMessage = {};
    Object.entries(mapper).forEach(([key, value]) => {
        const regex = new RegExp(`${value}='(.*)'`);
        const match = rawMessage.match(regex);
        parsedMessage[key as keyof ParsedMessage] = match ? match[1] : undefined;
    });
    return parsedMessage;
};

export const handler = createHandler<SNSHandler>(async (event) => {
    const messages = event.Records.map((record) =>
        parseMessage(record.Sns.Message, {
            stackId: 'StackId',
            timestamp: 'Timestamp',
            resourceStatus: 'ResourceStatus',
            resourceType: 'ResourceType',
            clientRequestToken: 'ClientRequestToken',
        }),
    );

    /**
     * TODO:
     *
     * Assign maibe client request token or (stack id) on product launch
     * Then, on every new event, notify the client that the product is being launched.
     * On STACK CREATE COMPLETE, assing instance id to the instance db row.
     *
     * Change deletion process to terminate stack instead of terminating instance directly.
     */

    console.log(JSON.stringify(messages, null, 2));

    await Promise.resolve();
}, false);
