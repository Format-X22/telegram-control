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
    takeTrigger: number;
    take: number;
    isLong: boolean;
    stopAmount: number;
    takeAmount: number;
    disableNormalizing: boolean;
    lastError: string;
}
