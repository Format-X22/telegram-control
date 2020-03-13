import { BWorker, IWorker } from './Worker';
import { TaskState } from '../task/Task';

const CANDLES_TO_DROP: number = 4;

export class Zigzag extends BWorker implements IWorker {
    protected async placeInitOrders(): Promise<void> {
        this.enterOrderId = await this.task.stock.placeStopMarketOrder(
            this.task.enter,
            this.task.amount
        );
        this.takeOrderId = await this.task.stock.placeTakeLimitOrder(
            this.task.take,
            this.task.takeTrigger,
            this.task.takeAmount
        );

        // TODO Calc and place safeLineOrder
        this.safeLineOrderId = 100;
    }

    protected async removeInitOrders(): Promise<void> {
        await this.task.stock.cancelOrder(this.enterOrderId);
        await this.task.stock.cancelOrder(this.takeOrderId);
        await this.task.stock.cancelOrder(this.safeLineOrderId);
    }

    protected async onWaiting(): Promise<void> {
        const hasEnterOrder: boolean = await this.task.stock.hasOrder(this.enterOrderId);

        if (!hasEnterOrder) {
            this.stopOrderId = await this.task.stock.placeStopMarketOrder(
                this.task.stop,
                this.task.stopAmount
            );

            this.task.enterTime = new Date();
            this.task.state = TaskState.Inside;
        }
    }

    protected async onInside(): Promise<void> {
        const hasTakeOrder: boolean = await this.task.stock.hasOrder(this.takeOrderId);
        const hasStopOrder: boolean = await this.task.stock.hasOrder(this.stopOrderId);
        const hasSafeLineOrder: boolean = await this.task.stock.hasOrder(this.safeLineOrderId);
        const isTimeToDrop: boolean = this.fullCandlesAfterStart() === CANDLES_TO_DROP;

        if (!hasTakeOrder) {
            await this.task.stock.cancelOrder(this.stopOrderId);

            this.task.exitTime = new Date();
            this.task.state = TaskState.Take;
            return;
        }

        if (hasTakeOrder && !hasStopOrder) {
            await this.task.stock.cancelOrder(this.takeOrderId);

            this.task.exitTime = new Date();
            this.task.state = TaskState.Loss;
            return;
        }

        if (!hasSafeLineOrder) {
            // TODO Calc and move stop order
            return;
        }

        if (hasSafeLineOrder && isTimeToDrop) {
            await this.task.stock.cancelOrder(this.takeOrderId);
            await this.task.stock.cancelOrder(this.stopOrderId);
            await this.task.stock.cancelOrder(this.safeLineOrderId);

            await this.task.stock.placeMarketOrder(this.task.stopAmount);
            await this.alertCall('Drop old position');

            this.task.state = TaskState.Loss;
            return;
        }
    }
}
