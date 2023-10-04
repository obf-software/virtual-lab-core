import type { Config } from 'drizzle-kit';

export default {
    schema: './infrastructure/drizzle/schema.ts',
    out: './infrastructure/drizzle',
    driver: 'pg',
    dbCredentials: {
        connectionString: process.env.DATABASE_URL,
    },
} satisfies Config;
