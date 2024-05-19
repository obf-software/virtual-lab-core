import fetch from 'node-fetch';
import { ConfigVault } from '../../application/config-vault';
import { Errors } from '../../domain/dtos/errors';

export class LambdaLayerConfigVault implements ConfigVault {
    constructor(private readonly deps: { readonly AWS_SESSION_TOKEN: string }) {}

    getParameter = async (name: string): Promise<string | undefined> => {
        const url = new URL('http://localhost:2773/systemsmanager/parameters/get');
        url.searchParams.append('name', name);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-Aws-Parameters-Secrets-Token': this.deps.AWS_SESSION_TOKEN,
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
