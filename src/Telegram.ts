import * as TelegramBot from 'node-telegram-bot-api';
import { config } from './data/config';

import { TaskController } from './task/TaskController';

export class Telegram {
    private bot;
    private readonly tasks = [];
    private lastError;
    private taskController: TaskController;

    constructor() {
        this.bot = new TelegramBot(config.telegramKey, { polling: true });

        this.bot.on('text', this.handleText.bind(this));
        this.taskController = new TaskController(this);
    }

    public async send(text: string, id: number = config.telegramBotOwner) {
        await this.bot.sendMessage(id, text);
    }

    private async handleText(message) {
        const id: number = message.chat.id;
        const [command, ...data]: [string, string] = message.text.split(/ +/);

        if (id !== config.telegramBotOwner) {
            await this.send('Just private use only.', id);
            return;
        }

        await this.route(command, data);
    }

    private async route(command: string, data: [string]) {
        switch (command) {
            case '/status':
                await this.taskController.status();
                return;

            case '/bart':
            case '/zigzag':
            case '/spike':
                await this.taskController.handleTask(command.slice(1), data);
                return;

            case '/cancel':
                await this.taskController.cancel(data);
                return;
        }

        await this.send('Unknown command');
    }
}
