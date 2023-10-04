/* eslint-disable @typescript-eslint/no-unused-vars */
namespace NodeJS {
    interface ProcessEnv {
        IS_LOCAL?: string;
        AWS_REGION: string;
        AWS_EXECUTION_ENV: string;
        DATABASE_URL: string;
        APP_SYNC_API_URL: string;
        INSTANCE_PASSWORD: string;
        GUACAMOLE_CYPHER_KEY: string;
        SERVICE_CATALOG_NOTIFICATION_ARN: string;
    }
}
