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

    public helpMessageString(): string {
        return [
            'Call signature:',
            '',
            'zigzag',
            'stock {name}',
            'side {long/short}',
            'stop-price {int}',
            'stop-amount {int}',
            'enter-price {int}',
            'enter-trigger {int}',
            'enter-amount {int}',
            'take-price {int}',
            'take-trigger {int}',
            'take-amount {int}',
            'candle-call {time_like: 4h}, default: 4h',
        ].join('\n');
    }
}
