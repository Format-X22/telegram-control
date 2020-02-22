import { TStock, TWorker } from '../data/config';

export type ITask = {
    active: boolean;
    workerClass: new () => TWorker;
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
};
