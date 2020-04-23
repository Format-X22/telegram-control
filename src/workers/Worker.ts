export interface IWorker {
    lastStockError: string;
    init(params: Array<string>): boolean;
    start(): Promise<void>;
    stop(): Promise<void>;
    status(): string;
    cancel(): Promise<string>;
}
