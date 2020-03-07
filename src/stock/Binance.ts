import { IStock, TStockLastError, TStockPrice, TStockValue } from './Stock';

type TStockOrderId = string;
type TStockOrder = {
    // TODO -
};
type TStockPosition = {
    // TODO -
};
type TStockMarginData = {
    // TODO -
};

export class Binance implements IStock<TStockMarginData, TStockPosition, TStockOrder, TStockOrderId> {
    constructor() {
        // TODO -
    }

    async getMarginData(): Promise<TStockMarginData> {
        // TODO -
        return;
    }

    async getPosition(): Promise<TStockPosition> {
        // TODO -
        return;
    }

    async getOrders(): Promise<TStockOrder[]> {
        // TODO -
        return;
    }

    async placeLimitOrder(price: TStockPrice, value: TStockValue): Promise<TStockOrder> {
        // TODO -
        return;
    }

    async placeMarketOrder(value: TStockValue): Promise<TStockOrder> {
        // TODO -
        return;
    }

    async placeStopLimitOrder(
        price: TStockPrice,
        trigger: TStockPrice,
        value: TStockValue
    ): Promise<TStockOrder> {
        // TODO -
        return;
    }

    async placeStopMarketOrder(
        trigger: TStockPrice,
        value: TStockValue
    ): Promise<TStockOrder> {
        // TODO -
        return;
    }

    async placeTakeLimitOrder(
        price: TStockPrice,
        trigger: TStockPrice,
        value: TStockValue
    ): Promise<TStockOrder> {
        // TODO -
        return;
    }

    async placeTakeMarketOrder(
        trigger: TStockPrice,
        value: TStockValue
    ): Promise<TStockOrder> {
        // TODO -
        return;
    }

    async cancelOrder(orderID: TStockOrderId): Promise<unknown> {
        // TODO -
        return;
    }

    async hasOrder(orderID: TStockOrderId): Promise<boolean> {
        // TODO -
        return;
    }

    getLastError(): TStockLastError {
        // TODO -
        return;
    }
}
