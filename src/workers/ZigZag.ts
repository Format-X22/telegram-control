import { IWorker } from './Worker';

export class ZigZag implements IWorker {
    public lastStockError: string;

    // TODO -

    public init(params: Array<string>): boolean {
        // TODO -
        return true;
    }

    public async start(): Promise<void> {
        // TODO -
    }

    public async status(): Promise<string> {
        // TODO -
        return '';
    }

    public async cancel(force: boolean): Promise<boolean> {
        // TODO -
        return true;
    }
}
