import { PostConfirmationTriggerHandler } from 'aws-lambda';
import { createHandler, logger } from '../../../integrations/powertools';
import * as schema from '../../../drizzle/schema';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { UserRepository } from '../../user/repository';
import { UserService } from '../../user/service';

// Config
const { DATABASE_URL } = process.env;
const dbClient = drizzle(postgres(DATABASE_URL), { schema });

// Repository
const userRepository = new UserRepository(dbClient);

// Service
const userService = new UserService({ userRepository });

export const handler = createHandler<PostConfirmationTriggerHandler>(async (event) => {
    try {
        const userExists = await userService.exists(event.userName);

        logger.info(
            `User "${event.userName}" ${
                userExists ? 'exists, skipping creation' : 'does not exist, trying to create'
            }`,
        );

        if (!userExists) {
            const user = await userService.create({
                username: event.userName,
                role: 'PENDING',
            });
            logger.info(`Created user "${user.username}"`);
        }
    } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Could not create user "${event.userName}": ${reason}`, { error });
    }

    return event;
});
