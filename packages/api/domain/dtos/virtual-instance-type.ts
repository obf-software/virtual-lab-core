import { z } from 'zod';

export const virtualInstanceTypeSchema = z.object({
    name: z.string(),
    cpu: z.object({
        cores: z.number(),
        threadsPerCore: z.number(),
        vCpus: z.number(),
        manufacturer: z.string(),
        clockSpeedInGhz: z.number(),
    }),
    ram: z.object({
        sizeInMb: z.number(),
    }),
    gpu: z.object({
        totalGpuMemoryInMb: z.number(),
        devices: z
            .object({
                count: z.number(),
                name: z.string(),
                manufacturer: z.string(),
                memoryInMb: z.number(),
            })
            .array(),
    }),
    hibernationSupport: z.boolean(),
    networkPerformance: z.string(),
});

export type VirtualInstanceType = z.infer<typeof virtualInstanceTypeSchema>;
