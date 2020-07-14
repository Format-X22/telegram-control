import { Bitmex } from './Bitmex';
import { Binance } from './Binance';
import { Bybit } from './Bybit';
import { Huobi } from './Huobi';
import { Okex } from './Okex';

export type TStockPrice = number;
export type TStockValue = number;
export type TStockOrderId = number;
export type TStockLeverage = number;

export interface IStock {
    getLeverage(): Promise<TStockLeverage>;
    getOrders(): Promise<TStockOrderId[]>;
    placeLimitOrder(price: TStockPrice, value: TStockValue): Promise<TStockOrderId>;
    placeMarketOrder(value: TStockValue): Promise<TStockOrderId>;
    placeStopLimitOrder(
        price: TStockPrice,
        trigger: TStockPrice,
        value: TStockValue
    ): Promise<TStockOrderId>;
    placeStopMarketOrder(trigger: TStockPrice, value: TStockValue): Promise<TStockOrderId>;
    placeTakeLimitOrder(
        price: TStockPrice,
        trigger: TStockPrice,
        value: TStockValue
    ): Promise<TStockOrderId>;
    placeTakeMarketOrder(trigger: TStockPrice, value: TStockValue): Promise<TStockOrderId>;
    cancelOrder(orderID: TStockOrderId): Promise<void>;
    hasOrder(orderID: TStockOrderId): Promise<boolean>;
    hardStop(): Promise<void>;
}

export type TStock = typeof Bitmex | typeof Binance | typeof Bybit | typeof Huobi | typeof Okex;
export const StockByName: object = {
    [Bitmex.name.toLowerCase()]: Bitmex,
    [Binance.name.toLowerCase()]: Binance,
    [Bybit.name.toLowerCase()]: Bybit,
    [Huobi.name.toLowerCase()]: Huobi,
    [Okex.name.toLowerCase()]: Okex,
};
