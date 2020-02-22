import { ITask } from './ITask';
import { stocks, TStock, TWorker, workers } from '../data/config';
import { Bart } from '../workers/Bart';
import { Zigzag } from '../workers/Zigzag';
import { Telegram } from '../Telegram';

const BART_TAKE_DISTANCE = 0.86;
const BART_STOP_DISTANCE = -0.86;
const ZIGZAG_DISTANCE = 2.8;
const BAD_MOVE_PERCENT = 0.2;
const ENTER_SAFE_MARGIN_PERCENT = 0.05;
const EXIT_TRIGGER_MARGIN_PERCENT = 0.15;

export class TaskController {
    private readonly tasks = [];
    private lastError = null;

    constructor(private telegram: Telegram) {}

    public async handleTask(type: string, data: Array<string>) {
        const rawTask: ITask | null = this.buildRawTask(type, data);

        if (!rawTask) {
            await this.telegram.send('Invalid args');
            return;
        }

        const task = this.calcTask(rawTask);

        if (!task) {
            await this.telegram.send('Calculation fail');
            return;
        }

        this.tasks.push(task);

        // TODO -

        task.active = true;

        await this.status();
    }

    private buildRawTask(type: string, data: Array<string>): ITask | null {
        const workerName: string = String(type).toLowerCase();
        const stockName: string = String(data[0]).toLowerCase();
        const amount: number = Number(data[1]);
        const enter: number = Number(data[2]);
        const stop: number = Number(data[3]);
        const workerClass: new () => TWorker = workers[workerName];
        const stockClass: new () => TStock = stocks[stockName];

        if (!workerClass || !stockClass || [amount, enter, stop].some(v => !Number.isFinite(v))) {
            return null;
        }

        return {
            active: false,
            workerClass,
            worker: null,
            stockClass,
            stock: null,
            amount,
            enter,
            stop,
            exitTrigger: null,
            exit: null,
            isLong: stop < enter,
            stopAmount: null,
            exitAmount: null,
        };
    }

    private calcTask(task: ITask): ITask {
        if (task.workerClass === Bart) {
            task.exit = Math.round(
                task.enter * (1 - (task.stop / task.enter - 1) * BART_TAKE_DISTANCE)
            );
            task.stop = Math.round(
                task.enter * (1 - (task.stop / task.enter - 1) * BART_STOP_DISTANCE)
            );
        } else if (task.workerClass === Zigzag) {
            task.exit = Math.round(
                task.enter * (1 - (task.stop / task.enter - 1) * ZIGZAG_DISTANCE)
            );
        } else {
            return null;
        }

        if (task.isLong) {
            task.exitAmount = Math.round(
                -task.amount * (task.exit / task.enter - BAD_MOVE_PERCENT / 100)
            );
            task.stopAmount = Math.round(
                -task.amount * (2 - (task.enter / task.stop + BAD_MOVE_PERCENT / 100))
            );

            task.enter = Math.round(task.enter * (1 + ENTER_SAFE_MARGIN_PERCENT / 100));
            task.exitTrigger = Math.round(task.exit * (1 - EXIT_TRIGGER_MARGIN_PERCENT / 100));
        } else {
            task.amount = Math.round(-task.amount);
            task.exitAmount = Math.round(
                -task.amount * (task.exit / task.enter + BAD_MOVE_PERCENT / 100)
            );
            task.stopAmount = Math.round(
                -task.amount * (2 - (task.enter / task.stop - BAD_MOVE_PERCENT / 100))
            );

            task.enter = Math.round(task.enter * (1 - ENTER_SAFE_MARGIN_PERCENT / 100));
            task.exitTrigger = Math.round(task.exit * (1 + EXIT_TRIGGER_MARGIN_PERCENT / 100));
        }

        return task;
    }

    public async status() {
        const activeTasks: Array<ITask> = this.tasks.filter((task: ITask) => task.active);
        const messageLines: Array<String> = [];

        for (const [stockName, stockClass] of Object.entries(stocks)) {
            for (const [workerName, workerClass] of Object.entries(workers)) {
                for (const task of activeTasks) {
                    if (task.workerClass === workerClass && task.stockClass === stockClass) {
                        const explain = this.explainTaskStatus(task, workerName, stockName);

                        messageLines.push(
                            `Stock "${stockName}", type "${workerName}":\n\n ${explain}`
                        );
                    }
                }
            }
        }

        messageLines.push(`Last error: ${this.lastError}`);

        await this.telegram.send(messageLines.join('\n\n'));
    }

    private explainTaskStatus(task: ITask, workerName: string, stockName: string): string {
        return JSON.stringify(
            task,
            (key, value) => {
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

    public async cancel(data: [string]) {
        // TODO -

        await this.telegram.send('TODO');
    }
}
