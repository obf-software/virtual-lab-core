import { PostConfirmationTriggerHandler, PreTokenGenerationTriggerHandler } from 'aws-lambda';
import { createHandler, logger } from '../../integrations/powertools';
import { UserService } from '../users/user-service';
import { UserRepository } from '../users/user-repository';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../../drizzle/schema';

const { DATABASE_URL } = process.env;

const dbClient = drizzle(postgres(DATABASE_URL), { schema });
const userRepository = new UserRepository(dbClient);
const userService = new UserService(userRepository);

export const preTokenGenerationTrigger = createHandler<PreTokenGenerationTriggerHandler>(
    async (event) => {
        try {
            const responseEvent = { ...event };
            const user = await userService.getByUsername(event.userName);
            if (!user) throw new Error(`The user "${event.userName}" does not exist`);
            await userService.updateLastLoginAt(user.id);

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
);

export const postConfirmationTrigger = createHandler<PostConfirmationTriggerHandler>(
    async (event) => {
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
    },
);
