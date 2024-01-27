import { Logger } from '@aws-lambda-powertools/logger';
import { PreTokenGenerationTriggerEvent, PreTokenGenerationTriggerHandler } from 'aws-lambda';
import { UserDatabaseRepository } from '../../infrastructure/user-database-repository';
import { SignInUser } from '../../application/use-cases/user/sign-in-user';
import { HandlerAdapter } from '../../infrastructure/lambda/handler-adapter';

const { DATABASE_URL } = process.env;
const logger = new Logger();
const userRepository = new UserDatabaseRepository(DATABASE_URL);
const signInUser = new SignInUser(logger, userRepository);

export const handler = HandlerAdapter.create(logger).adapt<PreTokenGenerationTriggerHandler>(
    async (event) => {
        const output = await signInUser.execute({ username: event.userName });

        const responseEvent: PreTokenGenerationTriggerEvent = {
            ...event,
            response: {
                claimsOverrideDetails: {
                    claimsToAddOrOverride: {
                        'custom:role': output.getData().role,
                        'custom:userId': output.id.toString(),
                    },
                },
            },
        };

        return responseEvent;
    },
);
