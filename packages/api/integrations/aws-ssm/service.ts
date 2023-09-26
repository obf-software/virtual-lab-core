import { GetParametersCommand, SSMClient } from '@aws-sdk/client-ssm';

export class AwsSsmIntegration {
    private client: SSMClient;

    constructor(props: { AWS_REGION: string }) {
        this.client = new SSMClient({ region: props.AWS_REGION });
    }

    async getStringParameters<T extends Record<string, string>>(
        parameters: T,
    ): Promise<Record<keyof T, string>> {
        const command = new GetParametersCommand({
            Names: Object.values(parameters),
            WithDecryption: true,
        });
        const { Parameters } = await this.client.send(command);

        return Object.entries(parameters).reduce(
            (acc, [alias, parameterName]) => {
                const parameter = Parameters?.find((param) => param.Name === parameterName);
                const value = parameter?.Value;
                const type = parameter?.Type;

                if (parameter === undefined || type === 'StringList' || value === undefined) {
                    throw new Error(`Parameter ${parameterName} is invalid`);
                }

                acc[alias as keyof T] = value;
                return acc;
            },
            {} as Record<keyof T, string>,
        );
    }
}
