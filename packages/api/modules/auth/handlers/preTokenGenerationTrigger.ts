import { PreTokenGenerationTriggerHandler } from 'aws-lambda';
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

export const handler = createHandler<PreTokenGenerationTriggerHandler>(async (event) => {
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
});
