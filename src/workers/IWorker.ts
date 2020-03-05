import { ITask } from '../task/ITask';

export interface IWorker {
    init(task: ITask): Promise<void>;
}
