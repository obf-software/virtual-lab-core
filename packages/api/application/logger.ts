import { Logger as PowerToolsLogger } from '@aws-lambda-powertools/logger';

export interface Logger {
    info: PowerToolsLogger['info'];
    error: PowerToolsLogger['error'];
    warn: PowerToolsLogger['warn'];
    debug: PowerToolsLogger['debug'];
    addContext: PowerToolsLogger['addContext'];
}
