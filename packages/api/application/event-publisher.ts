import { ApplicationEvent } from '../domain/dtos/application-event';

export interface EventPublisher {
    publish(...events: ApplicationEvent[]): Promise<void>;
}
