import { EventPublisher } from '../../application/event-publisher';
import { ApplicationEvent } from '../../domain/dtos/application-event';

export class InMemoryEventPublisher implements EventPublisher {
    constructor(public storage: ApplicationEvent[] = []) {}

    async publish(...events: ApplicationEvent[]): Promise<void> {
        events.forEach((event) => {
            if (!event.isValid() || event.destination === 'NONE') return;
            this.storage.push(event);
        });

        return Promise.resolve();
    }
}
