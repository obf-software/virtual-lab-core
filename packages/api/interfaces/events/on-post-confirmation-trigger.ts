import { Logger } from '@aws-lambda-powertools/logger';
import { PostConfirmationTriggerHandler } from 'aws-lambda';
import { SignUpUser } from '../../application/use-cases/user/sign-up-user';
import { UserDatabaseRepository } from '../../infrastructure/repositories/user-database-repository';
import { HandlerAdapter } from '../../infrastructure/lambda/handler-adapter';

const { DATABASE_URL } = process.env;
const logger = new Logger();
const userRepository = new UserDatabaseRepository(DATABASE_URL);
const signUpUser = new SignUpUser(logger, userRepository);

export const handler = HandlerAdapter.create(logger).adapt<PostConfirmationTriggerHandler>(
    async (event) => {
        await signUpUser.execute({ username: event.userName });
    },
);
