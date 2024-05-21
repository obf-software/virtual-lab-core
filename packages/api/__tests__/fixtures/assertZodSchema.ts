import { z } from 'zod';

/**
 * Helper function to assert that a Zod schema can parse a list of inputs.
 */
export const assertZodSchema = (inputs: unknown[], schema: z.Schema, expecting: boolean) => {
    const execute = (input: unknown) => schema.safeParse(input);
    const results = inputs.map(execute);

    expect(results.length).toBe(inputs.length);
    expect(results.map((result) => result.success)).toEqual(Array(inputs.length).fill(expecting));
};
