import { Logger } from '@aws-lambda-powertools/logger';

export class AWSLogger extends Logger {
    constructor() {
        super({ serviceName: 'api' });
    }
}
