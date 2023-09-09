import { Handler } from 'aws-lambda';
import { createHandler, logger } from '../integrations/powertools';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import dayjs from 'dayjs';

const { DATABASE_URL } = process.env;

export const handler = createHandler<Handler<{ params: Record<string, never> }, void>>(async () => {
    logger.info(`Database migration started`);
    const startDate = dayjs();

    const client = postgres(DATABASE_URL, { max: 1 });
    const database = drizzle(client);
    await migrate(database, { migrationsFolder: './drizzle' });

    logger.info(`Database migration completed in ${dayjs().diff(startDate, 'second')} seconds`);
});
