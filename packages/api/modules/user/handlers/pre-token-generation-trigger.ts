import { PreTokenGenerationTriggerHandler } from 'aws-lambda';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { handlerAdapter } from '../../../infrastructure/powertools/handler-adapter';
import { Logger } from '@aws-lambda-powertools/logger';
import { UserRepository } from '../../../infrastructure/repositories';
import { SignInUseCase } from '../use-cases/sign-in';
import { schema } from '../../../infrastructure/repositories/protocols';

const { DATABASE_URL } = process.env;
const dbClient = drizzle(postgres(DATABASE_URL), { schema });
const logger = new Logger();

const signInUseCase = new SignInUseCase(new UserRepository(dbClient));

export const handler = handlerAdapter<PreTokenGenerationTriggerHandler>(
    async (event) => {
        try {
            const user = await signInUseCase.execute(event.userName);

            const responseEvent = { ...event };
            responseEvent.response = {
                claimsOverrideDetails: {
                    claimsToAddOrOverride: {
                        'custom:role': user.role,
                        'custom:userId': user.id.toString(),
                    },
                },
            };
            return responseEvent;
        } catch (error) {
            const reason = error instanceof Error ? error.message : 'Unknown error';
            logger.error(`Failed to generate token: ${reason}`, { error });
            return event;
        }
    },
    { isHttp: false, logger },
);
