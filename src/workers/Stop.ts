import { IWorker } from './Worker';
import { IStock, StockByName, TStock, TStockOrderId } from '../stock/Stock';
import { Collection } from './Collection';

const MAX_ORDER_SIZE: number = 300_000;

export class Stop implements IWorker {
    private amount: number;
    private triggerPrice: number;
    private enterPrice: number;
    private cancelPrice: number | false;

    private stock: IStock;
    private triggerOrder: TStockOrderId;
    private enterOrder: TStockOrderId;
    private cancelOrder: TStockOrderId;

    public lastStockError: string;

    public init(params: Array<string>): boolean {
        try {
            if (!this.makeStockClient(params[0]) || !this.validateCommands(params.slice(1))) {
                return false;
            }
        } catch (error) {
            return false;
        }

        return true;
    }

    public async start(): Promise<void> {
        let triggerAmount: number;

        if (this.amount > 0) {
            triggerAmount = 1;
        } else {
            triggerAmount = -1;
        }

        this.triggerOrder = await this.stock.placeLimitOrder(this.triggerPrice, triggerAmount);

        this.loop();
    }

    public async status(): Promise<string> {
        let status: string = '';

        if (await this.stock.hasOrder(this.triggerOrder)) {
            status += `Wait for trigger on ${this.triggerPrice}.`;
        } else {
            status += `Active and wait for execution on ${this.enterPrice}`;

            if (this.cancelPrice) {
                status += ` or cancel on ${this.cancelPrice}`;
            }

            status += '.';
        }

        return status;
    }

    public async cancel(force: boolean): Promise<boolean> {
        if (force) {
            try {
                await this.stock.hardStop();
            } catch (error) {
                // Just try
            }

            return false;
        }

        if (await this.stock.hasOrder(this.triggerOrder)) {
            await this.stock.cancelOrder(this.triggerOrder);
        }

        // TODO Cancel orders
        // TODO Stop loop

        return true;
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

        return true;
    }

    private extractCommands(rawCommands: Array<string>): void {
        const commands: Map<string, string> = Collection.rawCommandsToMap(rawCommands);

        this.amount = Number(commands.get('amount'));
        this.triggerPrice = Number(commands.get('trigger'));
        this.enterPrice = Number(commands.get('enter'));
        this.cancelPrice = Number(commands.get('cancel')) || false;
    }

    // TODO -
    private loop(): void {
        // TODO Try iteration, do nothing on hardStop

        if (this.stock.hasOrder(this.triggerOrder)) {
            console.log(true);
        } else {
            console.log(false);
        }
    }
}
