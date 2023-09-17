import crypto from 'crypto';
import { CommonConnectionSettings } from './protocols';

export class GuacamoleIntegration {
    private cypherKey: string;

    constructor(cypherKey: string) {
        this.cypherKey = cypherKey;
    }

    createConnectionToken<T extends CommonConnectionSettings>(settings: T) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('AES-256-CBC', this.cypherKey, iv);

        let crypted = cipher.update(JSON.stringify(settings), 'utf8', 'base64');
        crypted += cipher.final('base64');

        const data = {
            iv: iv.toString('base64'),
            value: crypted,
        };

        return Buffer.from(JSON.stringify(data)).toString('base64');
    }
}
