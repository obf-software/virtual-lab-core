import { z } from 'zod';
import { Errors } from '../dtos/errors';
import { Logger } from '../../application/logger';

type UseCaseMethod = (input: unknown) => Promise<unknown>;

interface UseCaseTarget {
    constructor: {
        name: string;
    };
    logger?: Logger;
}

export const useCaseExecute =
    (schema: z.Schema) =>
    (target: UseCaseTarget, propertyKey: string, descriptor: PropertyDescriptor) => {
        const originalMethod = descriptor.value as UseCaseMethod;

        function decoreatedMethod(this: UseCaseTarget, input: unknown) {
            this.logger?.debug(`${target.constructor.name}.${propertyKey}`, { input });

            const inputValidation = schema.safeParse(input);
            if (!inputValidation.success) throw Errors.validationError(inputValidation.error);

            return originalMethod.apply(this, [input]);
        }

        descriptor.value = decoreatedMethod;

        return descriptor;
    };
