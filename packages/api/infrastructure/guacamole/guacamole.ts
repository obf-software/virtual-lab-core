import crypto from 'crypto';
import { RDPConnectionSettings, VNCConnectionSettings } from './protocols';

export class Guacamole {
    constructor(private readonly GUACAMOLE_CYPHER_KEY: string) {}

    private createConnectionString(connectionData: unknown) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('AES-256-CBC', this.GUACAMOLE_CYPHER_KEY, iv);

        let crypted = cipher.update(JSON.stringify(connectionData), 'utf8', 'base64');
        crypted += cipher.final('base64');

        const data = {
            iv: iv.toString('base64'),
            value: crypted,
        };

        const token = Buffer.from(JSON.stringify(data)).toString('base64');
        return `token=${token}`;
    }

    createVncConnectionString(settings: VNCConnectionSettings) {
        return this.createConnectionString({
            connection: { type: 'vnc', settings },
        });
    }

    createRdpConnectionString(settings: RDPConnectionSettings) {
        return this.createConnectionString({
            connection: { type: 'rdp', settings },
        });
    }
}
