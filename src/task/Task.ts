import { TWorker } from '../workers/Worker';
import { TStock } from '../stock/Stock';
import { Telegram } from '../Telegram';

export enum TaskState {
    Constructed,
    Init,
    Destroyed,
    Critical,
    Waiting,
    Inside,
    Take,
    Loss,
}

export class Task {
    id: number;
    state: TaskState;
    workerClass: new (task: Task, telegram: Telegram) => TWorker;
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
    disableNormalizing: boolean;
    lastError: string;
}
