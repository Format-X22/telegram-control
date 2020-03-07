import { TWorker } from '../workers/Worker';
import { TStock } from '../stock/Stock';
import { Telegram } from '../Telegram';

export type TTask = {
    id: number;
    state: 'CONSTRUCT' | 'INIT' | 'DESTROYED' | 'ERROR';
    workerClass: new (task: TTask, telegram: Telegram) => TWorker;
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
