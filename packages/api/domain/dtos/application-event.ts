import { z } from 'zod';

export const applicationEventDetailSchema = z.object({
    username: z.string().min(1),
});

export type ApplicationEventDetail = z.infer<typeof applicationEventDetailSchema>;

export abstract class ApplicationEvent<T extends ApplicationEventDetail = ApplicationEventDetail> {
    constructor(
        public destination: 'BUS' | 'CLIENT' | 'NONE',
        public type: string,
        public detailSchema: z.ZodSchema,
    ) {}

    abstract detail: T;

    isValid(): boolean {
        const validation = this.detailSchema.safeParse(this.detail);
        return validation.success;
    }
}
