/* eslint-disable @typescript-eslint/no-unused-vars */
namespace NodeJS {
    interface ProcessEnv {
        IS_LOCAL?: string;
        AWS_REGION: string;
        AWS_EXECUTION_ENV: string;
        AWS_SESSION_TOKEN: string;

        SHARED_SECRET_NAME: string;
        APP_SYNC_API_URL: string;
        API_EVENT_BUS_NAME: string;
        API_SNS_TOPIC_ARN: string;
        DATABASE_URL_PARAMETER_NAME: string;
        INSTANCE_PASSWORD_PARAMETER_NAME: string;
        GUACAMOLE_CYPHER_KEY_PARAMETER_NAME: string;
    }
}
