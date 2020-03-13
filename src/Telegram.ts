import * as TelegramBot from 'node-telegram-bot-api';
import { config } from './data/config';

import { TaskController } from './task/TaskController';

export class Telegram {
    private bot: TelegramBot;
    private taskController: TaskController;

    constructor() {
        this.bot = new TelegramBot(config.telegramKey, { polling: true });

        this.bot.on('text', this.handleText.bind(this));
        this.taskController = new TaskController(this);

        this.send('Started!').catch((error: Error): void => {
            console.error(error);
            process.exit(1);
        });
    }

    public async send(text: string, id: number = config.telegramBotOwner): Promise<void> {
        await this.bot.sendMessage(id, text);
    }

    private async handleText(message: { chat: { id: number }; text: string }): Promise<void> {
        const id: number = message.chat.id;
        const [command, ...data]: string[] = message.text.split(/ +/);

        if (id !== config.telegramBotOwner) {
            await this.send('Just private use only.', id);
            return;
        }

        await this.route(command, data);
    }

    private async route(command: string, data: string[]): Promise<void> {
        switch (command) {
            case '/status':
                await this.taskController.status();
                return;

            case '/bart':
            case '/zigzag':
                await this.taskController.handleTask(command.slice(1), data);
                return;

            case '/cancel':
                await this.taskController.cancel(data);
                return;
        }

        await this.send('Unknown command');
    }
}
