export class Notification {
    constructor(
        readonly username: string,
        readonly type: string,
        readonly data: Record<string, unknown>,
    ) {}
}
