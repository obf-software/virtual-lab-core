import { Logger as PowerToolsLogger } from '@aws-lambda-powertools/logger';
import { Logger } from '../../application/logger';

export class AWSLogger extends PowerToolsLogger implements Logger {
    constructor() {
        super({ serviceName: 'api' });
    }
}
