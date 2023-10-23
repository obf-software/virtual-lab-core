import { Handler } from 'aws-lambda';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import dayjs from 'dayjs';
import { Logger } from '@aws-lambda-powertools/logger';
import { HandlerAdapter } from '../../infrastructure/lambda/handler-adapter';

const { DATABASE_URL } = process.env;
const logger = new Logger();

export const handler = HandlerAdapter.create(logger).adapt<
    Handler<{ params: { appMode: 'dev' | 'deploy' | 'remove' } }, void>
>(async (event) => {
    logger.info(`Database migration started`);
    const startDate = dayjs();

    if (event.params.appMode === 'dev') {
        logger.info(`Skipping database migration because app mode is 'dev'`);
        return;
    }

    const client = postgres(DATABASE_URL, { max: 1 });
    const database = drizzle(client);
    await migrate(database, { migrationsFolder: './drizzle' });

    logger.info(`Database migration completed in ${dayjs().diff(startDate, 'second')} seconds`);
});
