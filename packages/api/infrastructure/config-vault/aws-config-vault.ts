import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import { ConfigVault } from '../../application/config-vault';

export class AWSConfigVault implements ConfigVault {
    private readonly secretsManagerClient: SecretsManagerClient;

    private readonly ssmClient: SSMClient;

    constructor(
        AWS_REGION: string,
        private readonly AWS_SECRET_NAME: string,
    ) {
        this.secretsManagerClient = new SecretsManagerClient({ region: AWS_REGION });
        this.ssmClient = new SSMClient({ region: AWS_REGION });
    }

    getSecret = async (name: string): Promise<string | undefined> => {
        const command = new GetSecretValueCommand({ SecretId: this.AWS_SECRET_NAME });
        const { SecretString } = await this.secretsManagerClient.send(command);
        const parsedSecret = JSON.parse(SecretString ?? '{}') as Record<string, string | undefined>;
        return parsedSecret[name];
    };

    getParameter = async (name: string): Promise<string | undefined> => {
        const command = new GetParameterCommand({ Name: name, WithDecryption: true });
        const { Parameter } = await this.ssmClient.send(command);
        return Parameter?.Value;
    };
}
