export interface ConfigVault {
    getParameter(name: string): Promise<string | undefined>;
}
