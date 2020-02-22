import { IStock } from '../stock/IStock';
import { IWorker } from '../workers/IWorker';

export type ITask = {
    active: boolean;
    workerClass: IWorker;
    worker: IWorker;
    stockClass: IStock;
    stock: IStock;
    amount: number;
    enter: number;
    stop: number;
    exitTrigger: number;
    exit: number;
    isLong: boolean;
    stopAmount: number;
    exitAmount: number;
};
