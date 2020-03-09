import { Bitmex } from './Bitmex';
import { Binance } from './Binance';

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
}

export type TStock = Bitmex | Binance;
