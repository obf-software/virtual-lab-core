/* eslint-disable @typescript-eslint/no-unused-vars */
namespace NodeJS {
    interface ProcessEnv {
        IS_LOCAL?: string;
        AWS_REGION: string;
        AWS_EXECUTION_ENV: string;
        AWS_SESSION_TOKEN: string;

        DATABASE_URL_PARAMETER_NAME: string;
        INSTANCE_PASSWORD_PARAMETER_NAME: string;
        GUACAMOLE_CYPHER_KEY_PARAMETER_NAME: string;
        SERVICE_CATALOG_LINUX_PRODUCT_ID_PARAMETER_NAME: string;
        SERVICE_CATALOG_WINDOWS_PRODUCT_ID_PARAMETER_NAME: string;
        SNS_TOPIC_ARN: string;
        EVENT_BUS_NAME: string;
        EVENT_BUS_ARN: string;
        EVENT_BUS_PUBLISHER_ROLE_ARN: string;
        APP_SYNC_API_URL: string;
        COGNITO_USER_POOL_ID: string;
    }
}
