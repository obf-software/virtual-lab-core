import { EventPublisher } from '../../application/event-publisher';
import { ApplicationEvent } from '../../domain/dtos/application-event';

export class InMemoryEventPublisher implements EventPublisher {
    constructor(public storage: ApplicationEvent[] = []) {}

    reset(): void {
        this.storage = [];
    }

    async publish(...events: ApplicationEvent[]): Promise<void> {
        events.forEach((event) => {
            if (!event.isValid() || event.destination === 'NONE') {
                console.error('Invalid event', event);
                return;
            }
            this.storage.push(event);
        });

        return Promise.resolve();
    }
}
