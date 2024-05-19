import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import { ConfigVault } from '../../application/config-vault';

export class AWSConfigVault implements ConfigVault {
    private readonly ssmClient: SSMClient;

    constructor(
        private readonly deps: {
            readonly AWS_REGION: string;
        },
    ) {
        this.ssmClient = new SSMClient({ region: deps.AWS_REGION });
    }

    getParameter = async (name: string): Promise<string | undefined> => {
        const command = new GetParameterCommand({ Name: name, WithDecryption: true });
        const { Parameter } = await this.ssmClient.send(command);
        return Parameter?.Value;
    };
}
