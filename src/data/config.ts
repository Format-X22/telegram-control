import { Bitmex } from '../stock/Bitmex';
import { Binance } from '../stock/Binance';
import * as jsonConfig from '../../config.json';
import { Bart } from '../workers/Bart';
import { Zigzag } from '../workers/Zigzag';

const rawConfig = jsonConfig as {
    telegramKey: string;
    telegramBotOwner: number;
};

export const config = {
    telegramKey: rawConfig.telegramKey,
    telegramBotOwner: rawConfig.telegramBotOwner,
};

export const stocks = {
    bitmex: Bitmex,
    binance: Binance,
};

export const workers = {
    bart: Bart,
    zigzag: Zigzag,
};
