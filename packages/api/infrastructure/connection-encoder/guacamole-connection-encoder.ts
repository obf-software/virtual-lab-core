import crypto from 'node:crypto';
import { ConnectionEncoder } from '../../application/connection-encoder';
import {
    RDPConnectionSettings,
    VNCConnectionSettings,
} from '../../domain/dtos/connection-settings';
import { ConfigVault } from '../../application/config-vault';
import { Errors } from '../../domain/dtos/errors';

export class GuacamoleConnectionEncoder implements ConnectionEncoder {
    constructor(
        private readonly configVault: ConfigVault,
        private readonly GUACAMOLE_CYPHER_KEY_PARAMETER_NAME: string,
    ) {}

    private createConnectionString = async (connectionData: unknown) => {
        const guacamoleCypherKey = await this.configVault.getParameter(
            this.GUACAMOLE_CYPHER_KEY_PARAMETER_NAME,
        );
        if (!guacamoleCypherKey) throw Errors.internalError('Guacamole cypher key not found');

        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('AES-256-CBC', guacamoleCypherKey, iv);

        let crypted = cipher.update(JSON.stringify(connectionData), 'utf8', 'base64');
        crypted += cipher.final('base64');

        const data = {
            iv: iv.toString('base64'),
            value: crypted,
        };

        const token = Buffer.from(JSON.stringify(data)).toString('base64');
        return `token=${token}`;
    };

    encodeVncConnection = async (settings: VNCConnectionSettings): Promise<string> =>
        this.createConnectionString({
            connection: {
                type: 'vnc',
                settings,
            },
        });

    encodeRdpConnection = async (settings: RDPConnectionSettings): Promise<string> =>
        this.createConnectionString({
            connection: {
                type: 'rdp',
                settings,
            },
        });
}
