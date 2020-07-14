import { Telegram } from './Telegram';
import { IWorker } from './workers/Worker';
import { Order } from './workers/Order';

let lastTaskId: number = 0;

export class Controller {
    private readonly workers: Map<number, IWorker> = new Map();

    constructor(private telegram: Telegram) {}

    public async route(command: string, data: Array<string>): Promise<void> {
        switch (command) {
            case '/help':
            case 'help':
                await this.showHelp();
                return;

            case 'order':
                await this.makeOrderTask(data);
                return;

            case 'status':
                await this.status();
                return;

            case 'cancel':
                await this.cancel(data);
                return;

            default:
                await this.telegram.send('Unknown command');
        }
    }

    private async makeOrderTask(data: Array<string>): Promise<void> {
        const worker: Order = new Order();

        if (!worker.init(data)) {
            await this.telegram.send('Invalid params');
            return;
        }

        this.workers.set(++lastTaskId, worker);

        await worker.start();
        await this.status();
    }

    public async status(): Promise<void> {
        let messageLines: Array<string> = [];

        for (const [id, worker] of this.workers) {
            messageLines.push(`Id: ${id}`);
            messageLines.push(`Status: ${await worker.status()}`);
            messageLines.push(`Last stock error: ${worker.lastStockError || 'None'}`);
            messageLines.push('\n');
        }

        await this.telegram.send(messageLines.join('\n') || 'No any tasks');
    }

    public async cancel(data: Array<string>): Promise<void> {
        const id: number = Number(data[0]);
        const force: boolean = Boolean(data[1]);

        if (!Number.isFinite(id) || id === 0) {
            await this.telegram.send('Invalid params');
            return;
        }

        const worker: IWorker = this.workers.get(id);

        if (!worker) {
            await this.telegram.send('Not found');
            return;
        }

        try {
            const result: boolean = await worker.cancel(force);

            if (!result) {
                await this.telegram.send('Cant do safe cancel');
            }
        } catch (error) {
            await this.telegram.send('Error on cancel task');
            return;
        }

        this.workers.delete(id);

        await this.status();
    }

    private async showHelp(): Promise<void> {
        await this.telegram.send(
            [
                'help => print this message',
                'alias /help',
                '',
                'status => show all tasks status',
                '',
                'cancel {id} => cancel task by id',
                '',
                'cancel {id} force => cancel task by id with force',
                '',
                'order {args...} => place order',
                '',
                '_____________________________________________________',
                '',
                'ORDER call signature:',
                '',
                'order {stock_name}',
                '(bitmex, binance, bybit, huobi, okex)',
                '',
                'Arguments:',
                '',
                'type {order_type}',
                '(limit, market, stopLimit, stopMarket, takeLimit, takeMarket)',
                '',
                'amount {int}',
                '',
                '[price] {int}',
                '(limit-type only)',
                '',
                '[trigger] {int}',
                '(stop/take-type only)',
                '',
                '[up-cancel] {int}',
                '',
                '[down-cancel] {int}',
                '',
                '[up-activate] {int}',
                '',
                '[down-activate] {int}',
                '',
            ].join('\n')
        );
    }
}
