/* eslint-disable @typescript-eslint/no-explicit-any */

export interface IUseCase<T = unknown> {
    execute: (...args: any[]) => Promise<T>;
}
