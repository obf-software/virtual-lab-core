import { Construct } from 'constructs';
import { SSMClient, GetParametersCommand } from '@aws-sdk/client-ssm';
import { Stack } from 'aws-cdk-lib';

export const getSSMParameters = async <T extends Record<string, string>>(
    scope: Construct,
    parameters: T,
): Promise<Record<keyof T, string | string[] | undefined>> => {
    try {
        const client = new SSMClient({ region: Stack.of(scope).region });
        const command = new GetParametersCommand({
            Names: Object.values(parameters),
            WithDecryption: true,
        });
        const { Parameters } = await client.send(command);

        const response = Object.entries(parameters).reduce(
            (acc, [alias, parameterName]) => {
                const parameter = Parameters?.find((param) => param.Name === parameterName);

                let parameterValue: string | string[] | undefined;

                if (parameter?.Type === 'StringList') {
                    parameterValue = parameter.Value?.split(',');
                } else {
                    parameterValue = parameter?.Value;
                }

                if (parameter) {
                    acc[alias] = parameterValue;
                }

                return acc;
            },
            {} as Record<string, string | string[] | undefined>,
        );

        return response as Record<keyof T, string | string[] | undefined>;
    } catch (error) {
        const reason = error instanceof Error ? error.message : 'unknown';
        console.log(
            `Failed to get SSM parameters [${Object.values(parameters).join(', ')}]: ${reason}`,
        );
        throw error;
    }
};
