import { IWorker } from './IWorker';
import { ITask } from '../task/ITask';

export class Zigzag implements IWorker {
    private task = null;

    async init(task: ITask) {
        this.task = task;

        // TODO -
    }
}
