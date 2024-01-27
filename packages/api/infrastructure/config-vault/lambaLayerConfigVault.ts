import fetch from 'node-fetch';
import { ConfigVault } from '../../application/config-vault';
import { Errors } from '../../domain/dtos/errors';

export class LambdaLayerConfigVault implements ConfigVault {
    constructor(
        private readonly AWS_SESSION_TOKEN: string,
        private readonly AWS_SECRET_NAME: string,
    ) {}

    getSecret = async (name: string): Promise<string | undefined> => {
        const url = new URL('http://localhost:2773/secretsmanager/get');
        url.searchParams.append('secretId', this.AWS_SECRET_NAME);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-Aws-Parameters-Secrets-Token': this.AWS_SESSION_TOKEN,
            },
        });

        if (response.ok === false) {
            const reason = await response.text();
            throw Errors.internalError(`Failed to fetch secrets: ${reason}`);
        }

        const { SecretString } = (await response.json()) as { SecretString: string };
        const parsedSecret = JSON.parse(SecretString || '{}') as Record<string, string | undefined>;
        return parsedSecret[name];
    };

    getParameter = async (name: string): Promise<string | undefined> => {
        const url = new URL('http://localhost:2773/systemsmanager/parameters/get');
        url.searchParams.append('name', name);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-Aws-Parameters-Secrets-Token': this.AWS_SESSION_TOKEN,
            },
        });

        if (response.ok === false) {
            const reason = await response.text();
            throw Errors.internalError(`Failed to fetch parameters: ${reason}`);
        }

        const { Parameter } = (await response.json()) as { Parameter: { Value: string } };
        return Parameter.Value;
    };
}
