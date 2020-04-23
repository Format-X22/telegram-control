import * as request from 'request-promise-native';
import { config } from '../data/config';

export class PhoneCall {
    static async doCall(message: string): Promise<void> {
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
}
