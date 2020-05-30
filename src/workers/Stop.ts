import { IWorker } from './Worker';
import { IStock, StockByName, TStock, TStockOrderId } from '../stock/Stock';
import { Collection } from '../utils/Collection';
import { PhoneCall } from '../utils/PhoneCall';
import { EventLoop } from '../utils/EventLoop';
import { Sides } from '../data/dictionary';

const MAX_ORDER_SIZE: number = 300_000;
const ITERATION_SLEEP_TIMEOUT: number = 3_000;
const TRIGGER_POSITION_SIZE: number = 50;

export class Stop implements IWorker {
    public lastStockError: string;

    private amount: number;
    private triggerPrice: number;
    private enterPrice: number;
    private cancelPrice: number | false;
    private side: string;

    private stock: IStock;
    private triggerOrder: TStockOrderId;
    private enterOrder: TStockOrderId;
    private cancelOrder: TStockOrderId;
    private inPosition: boolean = false;
    private canceled: boolean = false;
    private done: boolean = false;
    private inIteration: boolean = false;

    public init(params: Array<string>): boolean {
        try {
            if (!this.makeStockClient(params[0]) || !this.validateCommands(params.slice(1))) {
                return false;
            }
        } catch (error) {
            return false;
        }

        if (this.side === Sides.short) {
            this.amount = -this.amount;
        }

        return true;
    }

    public async start(): Promise<void> {
        let triggerAmount: number;

        if (this.amount > 0) {
            triggerAmount = TRIGGER_POSITION_SIZE;
        } else {
            triggerAmount = -TRIGGER_POSITION_SIZE;
        }

        this.triggerOrder = await this.stock.placeLimitOrder(this.triggerPrice, triggerAmount);

        if (this.cancelPrice) {
            this.cancelOrder = await this.stock.placeLimitOrder(this.cancelPrice, triggerAmount);
        }

        this.loop().catch((): void => void PhoneCall.doCall('Loop error'));
    }

    public async status(): Promise<string> {
        let status: string = '';

        if (this.canceled) {
            status += 'Canceled!';
        } else if (this.done) {
            status += 'Task done!';
        } else {
            if (await this.stock.hasOrder(this.triggerOrder)) {
                status += `Wait for trigger on ${this.triggerPrice}.`;
            } else {
                status += `Active and wait for execution on ${this.enterPrice}`;

                if (this.cancelPrice) {
                    status += ` or cancel on ${this.cancelPrice}`;
                }

                status += '.';
            }
        }

        return status;
    }

    public async cancel(force: boolean): Promise<boolean> {
        this.canceled = true;

        if (force) {
            try {
                await this.stock.hardStop();
            } catch (error) {
                // Just try
            }

            return false;
        }

        while (this.inIteration) {
            await EventLoop.sleep(ITERATION_SLEEP_TIMEOUT / 100);
        }

        if (await this.stock.hasOrder(this.enterOrder)) {
            await this.stock.cancelOrder(this.enterOrder);
        }

        if (await this.stock.hasOrder(this.triggerOrder)) {
            await this.stock.cancelOrder(this.triggerOrder);
        }

        if (await this.stock.hasOrder(this.cancelOrder)) {
            await this.stock.cancelOrder(this.cancelOrder);
        }

        return true;
    }

    public helpMessageString(): string {
        return [
            'Call signature:',
            '',
            'command:',
            '',
            'stop {stock_name}',
            '',
            'arguments:',
            '',
            'side {long/short}',
            'amount {int}',
            'trigger {int}',
            'enter {int}',
            '[cancel] {int}',
            '',
            'Hints:',
            '',
            'side short => stop order is short',
        ].join('\n');
    }

    private makeStockClient(stockName: string): boolean {
        const stock: TStock | undefined = StockByName[stockName];

        if (!stock) {
            return false;
        }

        this.stock = new stock(this);

        return true;
    }

    private validateCommands(rawCommands: Array<string>): boolean {
        this.extractCommands(rawCommands);

        if (
            [this.amount, this.triggerPrice, this.enterPrice].some(
                (param: number): boolean => !Number.isFinite(param) || param === 0
            )
        ) {
            return false;
        }

        if (this.cancelPrice && !Number.isFinite(this.cancelPrice)) {
            return false;
        }

        if (this.amount > MAX_ORDER_SIZE) {
            return false;
        }

        if (!Sides[this.side]) {
            return false;
        }

        return true;
    }

    private extractCommands(rawCommands: Array<string>): void {
        const commands: Map<string, string> = Collection.rawCommandsToMap(rawCommands);

        this.amount = Number(commands.get('amount'));
        this.triggerPrice = Number(commands.get('trigger'));
        this.enterPrice = Number(commands.get('enter'));
        this.cancelPrice = Number(commands.get('cancel')) || false;
        this.side = commands.get('side');
    }

    private async loop(): Promise<void> {
        while (!this.canceled && !this.done) {
            this.inIteration = true;
            await this.iteration();
            this.inIteration = false;
            await EventLoop.sleep(ITERATION_SLEEP_TIMEOUT);
        }
    }

    private async iteration(): Promise<void> {
        if (await this.stock.hasOrder(this.triggerOrder)) {
            return;
        }

        if (!this.inPosition) {
            this.enterOrder = await this.stock.placeStopMarketOrder(this.enterPrice, this.amount);
            this.inPosition = true;
            return;
        }

        if (this.cancelPrice && !(await this.stock.hasOrder(this.cancelOrder))) {
            await this.stock.cancelOrder(this.enterOrder);
            this.done = true;

            return;
        }

        if (!(await this.stock.hasOrder(this.enterOrder))) {
            if (this.cancelPrice) {
                await this.stock.cancelOrder(this.cancelOrder);
            }

            this.done = true;

            await PhoneCall.doCall('Stop triggered');
        }
    }
}
