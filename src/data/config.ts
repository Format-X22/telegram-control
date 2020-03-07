import { Bitmex } from '../stock/Bitmex';
import { Binance } from '../stock/Binance';
import * as jsonConfig from '../../config.json';
import { Bart } from '../workers/Bart';
import { Zigzag } from '../workers/Zigzag';
import { Spike } from '../workers/Spike';

type config = {
    telegramKey: string;
    telegramBotOwner: number;
    bitmexPublicKey: string;
    bitmexPrivateKey: string;
};

export const config: config = {
    telegramKey: jsonConfig.telegramKey,
    telegramBotOwner: jsonConfig.telegramBotOwner,
    bitmexPublicKey: jsonConfig.bitmexPublicKey,
    bitmexPrivateKey: jsonConfig.bitmexPrivateKey,
};

export const stocks: {
    bitmex: typeof Bitmex;
    binance: typeof Binance;
} = {
    bitmex: Bitmex,
    binance: Binance,
};

export const workers: {
    bart: typeof Bart;
    zigzag: typeof Zigzag;
    spike: typeof Spike;
} = {
    bart: Bart,
    zigzag: Zigzag,
    spike: Spike,
};
