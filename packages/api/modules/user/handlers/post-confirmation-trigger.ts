import { PostConfirmationTriggerHandler } from 'aws-lambda';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { handlerAdapter } from '../../../infrastructure/powertools/handler-adapter';
import { QuotaRepository, UserRepository } from '../../../infrastructure/repositories';
import { SignUpUseCase } from '../use-cases/sign-up';
import { Logger } from '@aws-lambda-powertools/logger';
import { schema } from '../../../infrastructure/repositories/protocols';

const { DATABASE_URL } = process.env;
const dbClient = drizzle(postgres(DATABASE_URL), { schema });
const logger = new Logger();

const signUpUseCase = new SignUpUseCase(
    new UserRepository(dbClient),
    new QuotaRepository(dbClient),
);

export const handler = handlerAdapter<PostConfirmationTriggerHandler>(
    async (event) => {
        try {
            const user = await signUpUseCase.execute(event.userName);
            logger.info(`User "${user.username}" signed up successfully`);
        } catch (error) {
            const reason = error instanceof Error ? error.message : 'Unknown error';
            logger.error(`Could not create user "${event.userName}": ${reason}`, { error });
            return event;
        }
    },
    { isHttp: false, logger },
);
