import { Bitmex } from '../stock/Bitmex';
import { Binance } from '../stock/Binance';
import * as jsonConfig from '../../config.json';
import { Bart } from '../workers/Bart';
import { Zigzag } from '../workers/Zigzag';
import { Spike } from '../workers/Spike';

const rawConfig = jsonConfig as {
    telegramKey: string;
    telegramBotOwner: number;
    bitmexPublicKey: string;
    bitmexPrivateKey: string;
};

export const config = {
    telegramKey: rawConfig.telegramKey,
    telegramBotOwner: rawConfig.telegramBotOwner,
    bitmexPublicKey: rawConfig.bitmexPublicKey,
    bitmexPrivateKey: rawConfig.bitmexPrivateKey,
};

export const stocks = {
    bitmex: Bitmex,
    binance: Binance,
};

export const workers = {
    bart: Bart,
    zigzag: Zigzag,
    spike: Spike,
};
