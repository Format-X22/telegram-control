import * as request from 'request-promise-native';
import { config } from '../data/config';
import { TaskState, Task } from '../task/Task';
import { Zigzag } from './Zigzag';
import { Bart } from './Bart';
import { EventLoop } from '../utils/EventLoop';
import { Telegram } from '../Telegram';
import { TStockOrderId } from '../stock/Stock';

export interface IWorker {
    start(): Promise<void>;
    stop(): Promise<void>;
}

export type TWorker = Zigzag | Bart;

const LOOP_TIMEOUT: number = 3000;

export abstract class BWorker {
    protected enterOrderId: TStockOrderId;
    protected takeOrderId: TStockOrderId;
    protected stopOrderId: TStockOrderId;

    private isLoopInProgress: boolean = false;
    private isStopLoopCalled: boolean = false;

    constructor(protected task: Task, protected telegram: Telegram) {}

    async start(): Promise<void> {
        this.task.state = TaskState.Init;

        try {
            await this.placeInitOrders();

            this.task.state = TaskState.Waiting;
        } catch (error) {
            this.task.state = TaskState.Critical;

            await this.telegram.send('Error on start');
            return;
        }

        this.startLoop();
    }

    async stop(): Promise<void> {
        await this.stopLoop();

        if (this.task.state === TaskState.Init) {
            await this.removeInitOrders();
        } else {
            await this.telegram.send('Cant full destroy - task not in INIT state');
        }

        this.task.state = TaskState.Destroyed;
    }

    protected startLoop(): void {
        setTimeout((): void => {
            if (this.isStopLoopCalled) {
                return;
            }

            this.isLoopInProgress = true;

            this.loop().then(
                (): void => {
                    this.isLoopInProgress = false;
                    this.startLoop();
                },
                (error: Error): void => {
                    console.error(error);

                    this.isLoopInProgress = false;
                    this.task.lastError = String(error);

                    this.telegram.send(`Critical error: ${String(error)}`).catch();
                    this.alertCall().catch();
                    this.task.state = TaskState.Critical;
                }
            );
        }, LOOP_TIMEOUT);
    }

    protected async loop(): Promise<void> {
        switch (this.task.state) {
            case TaskState.Waiting:
                await this.onWaiting();
                break;

            case TaskState.Inside:
                await this.onInside();
                break;

            case TaskState.Take:
                await this.onTake();
                break;

            case TaskState.Loss:
                await this.onLoss();
                break;

            default:
                throw new Error(`Invalid task state in loop - ${this.task.state}`);
        }
    }

    protected async onTake(): Promise<void> {
        await this.normalize();
    }
    protected async onLoss(): Promise<void> {
        await this.normalize();
    }

    protected async normalize(): Promise<void> {
        if (this.task.disableNormalizing) {
            return;
        }

        // TODO -
    }

    protected async stopLoop(): Promise<void> {
        this.isStopLoopCalled = true;

        while (this.isLoopInProgress) {
            await EventLoop.sleep(LOOP_TIMEOUT / 10);
        }
    }

    protected async alertCall(message: string = 'Error'): Promise<void> {
        await request({
            uri: 'https://smsc.ru/sys/send.php',
            qs: {
                login: config.phoneCallLogin,
                psw: config.phoneCallPass,
                phones: config.phoneCallPhone,
                mes: message,
                call: 1,
                voice: 'w',
                param: '20,10,3',
            },
        });
    }

    protected abstract async placeInitOrders(): Promise<void>;
    protected abstract async removeInitOrders(): Promise<void>;
    protected abstract async onWaiting(): Promise<void>;
    protected abstract async onInside(): Promise<void>;
}
