export interface IWorker {
    lastStockError: string;
    init(params: Array<string>): boolean;
    start(): Promise<void>;
    status(): Promise<string>;
    cancel(force: boolean): Promise<boolean>;
    helpMessageString(): string
}
