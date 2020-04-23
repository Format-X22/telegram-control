import * as jsonConfig from '../../config.json';

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
