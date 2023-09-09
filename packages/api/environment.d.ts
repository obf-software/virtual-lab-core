/* eslint-disable @typescript-eslint/no-unused-vars */
namespace NodeJS {
    interface ProcessEnv {
        IS_LOCAL?: string;
        AWS_REGION: string;
        AWS_EXECUTION_ENV: string;
    }
}
