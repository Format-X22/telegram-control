import { BWorker, IWorker } from './Worker';
import { TaskState } from '../task/Task';

export class Zigzag extends BWorker implements IWorker {
    protected async placeInitOrders(): Promise<void> {
        // TODO -
    }

    protected async removeInitOrders(): Promise<void> {
        // TODO -
    }

    protected async onWaiting(): Promise<void> {
        // TODO -
    }

    protected async onInside(): Promise<void> {
        // TODO -
    }
}
