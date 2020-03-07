import { TTask } from '../task/TTask';
import { Zigzag } from './Zigzag';
import { Spike } from './Spike';
import { Bart } from './Bart';

export class BWorker {
    constructor(protected task: TTask) {}
}

export interface IWorker {
    start(): Promise<null>;
    stop(): Promise<null>;
}

export type TWorker = Zigzag | Bart | Spike;
