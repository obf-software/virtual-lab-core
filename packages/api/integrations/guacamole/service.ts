import crypto from 'crypto';
import { VNCConnectionSettings } from './protocols';

export class GuacamoleIntegration {
    private createConnectionString(cypherKey: string, connectionData: unknown) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('AES-256-CBC', cypherKey, iv);

        let crypted = cipher.update(JSON.stringify(connectionData), 'utf8', 'base64');
        crypted += cipher.final('base64');

        const data = {
            iv: iv.toString('base64'),
            value: crypted,
        };

        const token = Buffer.from(JSON.stringify(data)).toString('base64');
        return `token=${token}`;
    }

    createVncConnectionString(cypherKey: string, settings: VNCConnectionSettings) {
        return this.createConnectionString(cypherKey, { connection: { type: 'vnc', settings } });
    }
}
