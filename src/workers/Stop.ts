import { IWorker } from './Worker';
import { IStock, StockByName, TStock } from '../stock/Stock';
import { PhoneCall } from '../utils/PhoneCall';

const MAX_ORDER_SIZE: number = 300_000;

export class Stop implements IWorker {
    public lastStockError: string;
    private stock: IStock;
    private amount: number;
    private trigger: number;
    private price: number;

    public init(params: Array<string>): boolean {
        try {
            const stock: TStock | undefined = StockByName[params[0]];

            if (!stock) {
                return false;
            }

            this.stock = new stock(this);

            this.amount = Number(params[1]);
            this.trigger = Number(params[2]);
            this.price = Number(params[3]);

            if (
                [this.amount, this.trigger, this.price].some(
                    (param: number): boolean => !Number.isFinite(param) || param === 0
                )
            ) {
                return false;
            }

            if (this.amount > MAX_ORDER_SIZE) {
                return false;
            }
        } catch (error) {
            return false;
        }

        return true;
    }

    public async start(): Promise<void> {
        console.log('start', this.stock, this.amount, this.trigger, this.price);
        await PhoneCall.doCall(this.price.toString());
    }

    public async stop(): Promise<void> {
        console.log('stop');
    }

    public status(): string {
        // TODO -
        return '';
    }

    public async cancel(): Promise<string> {
        // TODO -
        return '';
    }
}
