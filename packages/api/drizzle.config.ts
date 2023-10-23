import type { Config } from 'drizzle-kit';

export default {
    schema: './infrastructure/database/schema.ts',
    out: './infrastructure/database',
    driver: 'pg',
    dbCredentials: {
        connectionString: process.env.DATABASE_URL,
    },
} satisfies Config;
