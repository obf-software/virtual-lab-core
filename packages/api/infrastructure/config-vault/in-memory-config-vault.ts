import { ConfigVault } from '../../application/config-vault';

export class InMemoryConfigVault implements ConfigVault {
    constructor(
        public storage: {
            parameters?: Record<string, string | undefined>;
        } = {},
    ) {}

    getParameter = async (name: string): Promise<string | undefined> =>
        Promise.resolve(this.storage.parameters?.[name]);
}
