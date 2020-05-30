import { Sides } from '../data/dictionary';
import { TStockPrice, TStockValue } from '../stock/Stock';
import { Collection } from '../utils/Collection';

type TEnterOrderParams = {
    trigger: TStockPrice;
    price: TStockPrice;
    value: TStockValue;
};
type TTakeOrderParams = TEnterOrderParams;
type TStopOrderParams = {
    trigger: TStockPrice;
    value: TStockValue;
};

export type TFibonacciStrategyConfig = {
    enter1: TEnterOrderParams;
    enter2: TEnterOrderParams;
    enter3: TEnterOrderParams;
    stop1: TStopOrderParams;
    stop2: TStopOrderParams;
    stop3: TStopOrderParams;
    take: TTakeOrderParams;
};

export type TFibonacciCommands = {
    start: TStockPrice;
    end: TStockPrice;
    value: TStockValue;
    side: Sides;
};

type TInverter = 1 | -1;
type TLevelCalc = (multiplier: number) => (level: number) => number;
type TLevelCalcStep = (level: number) => number;

const FIB_0500: number = 0.5;
const FIB_0618: number = 0.618;
const FIB_0786: number = 0.786;
const FIB_1000: number = 1.0;
const FIB_1300: number = 1.3;
const SAFE_SIZE: number = 0.05;
const SQUEEZE: number = 0.225;
const TAKE_SAFE_SIZE: number = SQUEEZE * 2;
const STOP_SAFE: number = 0.6;

export class FibonacciCalc {
    static parseCommands(params: Array<string>): TFibonacciCommands | null {
        const commandsMap: Map<string, string> = Collection.rawCommandsToMap(params);
        const start: TFibonacciCommands['start'] = Number(commandsMap.get('start'));
        const end: TFibonacciCommands['end'] = Number(commandsMap.get('end'));
        const value: TFibonacciCommands['value'] = Number(commandsMap.get('value'));
        const side: TFibonacciCommands['side'] = commandsMap.get('side') as Sides;

        if (
            !Number.isFinite(start) ||
            !Number.isFinite(end) ||
            !Number.isFinite(value) ||
            !Sides[side]
        ) {
            return null;
        }

        return { start, end, value, side };
    }

    static calcByLevel({ start, end, value, side }: TFibonacciCommands): TFibonacciStrategyConfig {
        let inverter: TInverter;

        if (side === Sides.long) {
            inverter = 1;
        } else {
            inverter = -1;
        }

        const size: number = inverter * start - inverter * end;
        const enterSafeMultiplier: number = 1 + (inverter * SAFE_SIZE) / 100;
        const squeezeSafeMultiplier: number = 1 + (inverter * SQUEEZE) / 100;
        const stopSafeMultiplier: number = 1 - (inverter * SAFE_SIZE) / 100;
        const takeSafeMultiplier: number = 1 + (inverter * TAKE_SAFE_SIZE) / 100;

        const level: TLevelCalc = this.makeLevelCalc(end, size, inverter);
        const enterTriggerLevel: TLevelCalcStep = level(enterSafeMultiplier);
        const enterPriceLevel: TLevelCalcStep = level(squeezeSafeMultiplier);
        const stopTriggerLevel: TLevelCalcStep = level(stopSafeMultiplier);
        const takeTriggerLevel: TLevelCalcStep = level(takeSafeMultiplier);
        const takePriceLevel: TLevelCalcStep = level(1);

        const enter1Trigger: number = enterTriggerLevel(FIB_0618);
        const enter1Price: number = enterPriceLevel(FIB_0618);
        const stop1Trigger: number = stopTriggerLevel(FIB_0500);
        //

        const enter2Trigger: number = enterTriggerLevel(FIB_0786);
        const enter2Price: number = enterPriceLevel(FIB_0786);
        const stop2Trigger: number = stopTriggerLevel(FIB_0618);

        const enter3Trigger: number = enterTriggerLevel(FIB_1000);
        const enter3Price: number = enterPriceLevel(FIB_1000);
        const stop3Trigger: number = stopTriggerLevel(FIB_0786);

        const takeTrigger: number = takeTriggerLevel(FIB_1300);
        const takePrice: number = takePriceLevel(FIB_1300);

        return {
            enter1: {
                trigger: enter1Trigger,
                price: enter1Price,
                value: 0,
            },
            enter2: {
                trigger: enter2Trigger,
                price: enter2Price,
                value: 0,
            },
            enter3: {
                trigger: enter3Trigger,
                price: enter3Price,
                value: 0,
            },
            stop1: {
                trigger: stop1Trigger,
                value: 0,
            },
            stop2: {
                trigger: stop2Trigger,
                value: 0,
            },
            stop3: {
                trigger: stop3Trigger,
                value: 0,
            },
            take: {
                trigger: takeTrigger,
                price: takePrice,
                value: 0,
            },
        };
    }

    private static makeLevelCalc(end: TStockPrice, size: number, inverter: TInverter): TLevelCalc {
        return (multiplier: number): TLevelCalcStep => (level: number): number =>
            Math.round((end + inverter * (size * level)) * multiplier);
    }

    private static calcLeverage(enter: number, stop: number, inverter: TInverter): number {
        //
    }
}
