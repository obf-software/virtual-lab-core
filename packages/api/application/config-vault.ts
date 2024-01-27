export interface ConfigVault {
    getSecret(name: string): Promise<string | undefined>;
    getParameter(name: string): Promise<string | undefined>;
}
