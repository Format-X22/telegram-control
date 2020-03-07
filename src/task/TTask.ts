import { TWorker } from '../workers/Worker';
import { TStock } from '../stock/Stock';

export type TTask = {
    id: number;
    status: string;
    workerClass: new (task: TTask) => TWorker;
    worker: TWorker;
    stockClass: new () => TStock;
    stock: TStock;
    amount: number;
    enter: number;
    stop: number;
    exitTrigger: number;
    exit: number;
    isLong: boolean;
    stopAmount: number;
    exitAmount: number;
    lastError: string;
};
