import { Bitmex } from '../stock/Bitmex';
import { Binance } from '../stock/Binance';
import * as jsonConfig from '../../config.json';
import { Bart } from '../workers/Bart';
import { Zigzag } from '../workers/Zigzag';
import { Spike } from '../workers/Spike';

export const config: {
    telegramKey: string;
    telegramBotOwner: number;
    bitmexPublicKey: string;
    bitmexPrivateKey: string;
    phoneCallLogin: string;
    phoneCallPass: string;
    phoneCallPhone: string;
} = {
    telegramKey: jsonConfig.telegramKey,
    telegramBotOwner: jsonConfig.telegramBotOwner,
    bitmexPublicKey: jsonConfig.bitmexPublicKey,
    bitmexPrivateKey: jsonConfig.bitmexPrivateKey,
    phoneCallLogin: jsonConfig.phoneCallLogin,
    phoneCallPass: jsonConfig.phoneCallPass,
    phoneCallPhone: jsonConfig.phoneCallPhone,
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
