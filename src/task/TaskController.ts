import { TaskState, Task } from './Task';
import { stocks, workers } from '../data/config';
import { Bart } from '../workers/Bart';
import { Zigzag } from '../workers/Zigzag';
import { Telegram } from '../Telegram';
import { TWorker } from '../workers/Worker';
import { TStock } from '../stock/Stock';

const BART_TAKE_DISTANCE: number = 0.86;
const BART_STOP_DISTANCE: number = -0.86;
const ZIGZAG_DISTANCE: number = 2.8;
const BAD_MOVE_PERCENT: number = 0.2;
const ENTER_SAFE_MARGIN_PERCENT: number = 0.05;
const EXIT_TRIGGER_MARGIN_PERCENT: number = 0.15;

let lastTaskId: number = 0;

export class TaskController {
    private readonly tasks: Set<Task> = new Set();

    constructor(private telegram: Telegram) {}

    public async handleTask(type: string, data: string[]): Promise<void> {
        const rawTask: Task | null = this.buildRawTask(type, data);

        if (!rawTask) {
            await this.telegram.send('Invalid args');
            return;
        }

        const task: Task = this.calcTask(rawTask);

        if (!task) {
            await this.telegram.send('Calculation fail');
            return;
        }

        task.stock = new task.stockClass();
        task.worker = new task.workerClass(task, this.telegram);

        await task.worker.start();
        this.tasks.add(task);

        await this.status();
    }

    private buildRawTask(type: string, data: string[]): Task | null {
        const workerName: string = String(type).toLowerCase();
        const stockName: string = String(data[0]).toLowerCase();
        const amount: number = Number(data[1]);
        const enter: number = Number(data[2]);
        const stop: number = Number(data[3]);
        const size: Task['size'] = String(data[4]).toLowerCase() as Task['size'];
        const disableNormalizing: boolean = Boolean(data[5]);
        const workerClass: new () => TWorker = workers[workerName];
        const stockClass: new () => TStock = stocks[stockName];

        if (
            !workerClass ||
            !stockClass ||
            [amount, enter, stop].some((v: number): boolean => !Number.isFinite(v)) ||
            !['5m', '15m', '1h', '4h'].includes(size)
        ) {
            return null;
        }

        const task: Task = new Task();

        task.id = lastTaskId++;
        task.state = TaskState.Constructed;
        task.workerClass = workerClass;
        task.stockClass = stockClass;
        task.amount = amount;
        task.enter = enter;
        task.stop = stop;
        task.isLong = stop < enter;
        task.size = size;
        task.disableNormalizing = disableNormalizing;

        return task;
    }

    private calcTask(task: Task): Task {
        if (task.workerClass === Bart) {
            task.take = Math.round(
                task.enter * (1 - (task.stop / task.enter - 1) * BART_TAKE_DISTANCE)
            );
            task.stop = Math.round(
                task.enter * (1 - (task.stop / task.enter - 1) * BART_STOP_DISTANCE)
            );
        } else if (task.workerClass === Zigzag) {
            task.take = Math.round(
                task.enter * (1 - (task.stop / task.enter - 1) * ZIGZAG_DISTANCE)
            );
        } else {
            return null;
        }

        if (task.isLong) {
            task.takeAmount = Math.round(
                -task.amount * (task.take / task.enter - BAD_MOVE_PERCENT / 100)
            );
            task.stopAmount = Math.round(
                -task.amount * (2 - (task.enter / task.stop + BAD_MOVE_PERCENT / 100))
            );

            task.enter = Math.round(task.enter * (1 + ENTER_SAFE_MARGIN_PERCENT / 100));
            task.takeTrigger = Math.round(task.take * (1 - EXIT_TRIGGER_MARGIN_PERCENT / 100));
        } else {
            task.amount = Math.round(-task.amount);
            task.takeAmount = Math.round(
                -task.amount * (task.take / task.enter + BAD_MOVE_PERCENT / 100)
            );
            task.stopAmount = Math.round(
                -task.amount * (2 - (task.enter / task.stop - BAD_MOVE_PERCENT / 100))
            );

            task.enter = Math.round(task.enter * (1 - ENTER_SAFE_MARGIN_PERCENT / 100));
            task.takeTrigger = Math.round(task.take * (1 + EXIT_TRIGGER_MARGIN_PERCENT / 100));
        }

        return task;
    }

    public async status(): Promise<void> {
        const messageLines: string[] = [];

        for (const [stockName, stockClass] of Object.entries(stocks)) {
            for (const [workerName, workerClass] of Object.entries(workers)) {
                for (const task of this.tasks) {
                    if (task.workerClass === workerClass && task.stockClass === stockClass) {
                        const explain: string = this.explainTaskStatus(task, workerName, stockName);

                        messageLines.push(
                            `Stock "${stockName}", type "${workerName}":\n\n ${explain}`
                        );
                    }
                }
            }
        }

        if (!messageLines.length) {
            messageLines.push('Task list is empty');
        }

        await this.telegram.send(messageLines.join('\n\n'));
    }

    private explainTaskStatus(task: Task, workerName: string, stockName: string): string {
        return JSON.stringify(
            task,
            (key: string, value: string): string => {
                if (key === 'workerClass' || key === 'stockClass') {
                    return;
                }

                if (key === 'worker') {
                    return workerName;
                }

                if (key === 'stock') {
                    return stockName;
                }

                return value;
            },
            2
        );
    }

    public async cancel(data: string[]): Promise<void> {
        const id: number = Number(data[0]);
        let isCanceled: boolean = false;

        if (!Number.isFinite(id)) {
            await this.telegram.send('Invalid args');
            return;
        }

        for (const task of this.tasks) {
            if (task.id === id) {
                await task.worker.stop();
                this.tasks.delete(task);

                isCanceled = true;
                break;
            }
        }

        if (!isCanceled) {
            await this.telegram.send('Not found');
            return;
        }

        await this.status();
    }
}
