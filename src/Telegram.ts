import * as TelegramBot from 'node-telegram-bot-api';
import { config } from './data/config';

import { Controller } from './Controller';

export class Telegram {
    private bot: TelegramBot;
    private controller: Controller;

    constructor() {
        this.bot = new TelegramBot(config.telegramKey, { polling: true });

        this.bot.on('text', this.handleText.bind(this));
        this.controller = new Controller(this);

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

        if (id !== config.telegramBotOwner) {
            await this.send('Just private use only.', id);
            return;
        }

        const text: string = message.text.trim();
        let command: string;
        let data: Array<string>;

        try {
            const tokens: Array<string> = text.split(/ +/);

            command = tokens[0].toLowerCase();
            data = tokens.slice(1).map((token: string): string => token.toLowerCase());
        } catch (error) {
            await this.send('Invalid command.', id);
            return;
        }

        await this.controller.route(command, data);
    }
}
