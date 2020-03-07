import { TTask } from './TTask';
import { stocks, workers } from '../data/config';
import { Bart } from '../workers/Bart';
import { Zigzag } from '../workers/Zigzag';
import { Telegram } from '../Telegram';
import { Spike } from '../workers/Spike';
import { TWorker } from '../workers/Worker';
import { TStock } from '../stock/Stock';

const BART_TAKE_DISTANCE = 0.86;
const BART_STOP_DISTANCE = -0.86;
const ZIGZAG_DISTANCE = 2.8;
const BAD_MOVE_PERCENT = 0.2;
const ENTER_SAFE_MARGIN_PERCENT = 0.05;
const EXIT_TRIGGER_MARGIN_PERCENT = 0.15;

let lastTaskId = 0;

export class TaskController {
    private readonly tasks: Set<TTask> = new Set();

    constructor(private telegram: Telegram) {}

    public async handleTask(type: string, data: Array<string>) {
        const rawTask: TTask | null = this.buildRawTask(type, data);

        if (!rawTask) {
            await this.telegram.send('Invalid args');
            return;
        }

        const task = this.calcTask(rawTask);

        if (!task) {
            await this.telegram.send('Calculation fail');
            return;
        }

        task.stock = new task.stockClass();
        task.worker = new task.workerClass(task);

        await task.worker.start();
        this.tasks.add(task);

        await this.status();
    }

    private buildRawTask(type: string, data: Array<string>): TTask | null {
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
            id: lastTaskId++,
            status: 'CONSTRUCT',
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
            lastError: null,
        };
    }

    private calcTask(task: TTask): TTask {
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
        } else if (task.workerClass === Spike) {
            // TODO -
        } else {
            return null;
        }

        // TODO Spike invert calc

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
        const messageLines: Array<String> = [];

        for (const [stockName, stockClass] of Object.entries(stocks)) {
            for (const [workerName, workerClass] of Object.entries(workers)) {
                for (const task of this.tasks) {
                    if (task.workerClass === workerClass && task.stockClass === stockClass) {
                        const explain = this.explainTaskStatus(task, workerName, stockName);

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

    private explainTaskStatus(task: TTask, workerName: string, stockName: string): string {
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
        const id: number = Number(data[0]);
        let isCanceled = false;

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
