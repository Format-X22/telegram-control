import { ITask } from '../task/ITask';
import { IWorker } from './IWorker';

export class Bart implements IWorker {
    private task = null;

    async init(task: ITask) {
        this.task = task;

        // TODO -
    }
}
