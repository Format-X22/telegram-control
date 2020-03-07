import * as request from 'request-promise-native';
import { config } from '../data/config';
import { TTask } from '../task/TTask';
import { Zigzag } from './Zigzag';
import { Spike } from './Spike';
import { Bart } from './Bart';
import { EventLoop } from '../utils/EventLoop';
import { Telegram } from '../Telegram';

export interface IWorker {
    start(): Promise<void>;
    stop(): Promise<void>;
}

export type TWorker = Zigzag | Bart | Spike;

const LOOP_TIMEOUT: number = 3000;

export abstract class BWorker {
    private isLoopInProgress: boolean = false;
    private isStopLoopCalled: boolean = false;

    constructor(protected task: TTask, protected telegram: Telegram) {}

    async start(): Promise<void> {
        try {
            await this.placeInitOrders();
        } catch (error) {
            await this.telegram.send('Error on start');
            return;
        }

        this.task.state = 'INIT';

        this.startLoop();
    }

    async stop(): Promise<void> {
        await this.stopLoop();

        if (this.task.state === 'INIT') {
            await this.removeInitOrders();
        } else {
            await this.telegram.send('Cant full destroy - task not in INIT state');
        }

        this.task.state = 'DESTROYED';
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
                    this.task.state = 'ERROR';
                }
            );
        }, LOOP_TIMEOUT);
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
    protected abstract async loop(): Promise<void>;
}
