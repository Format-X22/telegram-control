import { IStock, TStockLeverage, TStockOrderId, TStockPrice, TStockValue } from './Stock';

export class Huobi implements IStock {
    constructor() {
        // TODO -
    }

    async getLeverage(): Promise<TStockLeverage> {
        // TODO -
        return;
    }

    async getOrders(): Promise<TStockOrderId[]> {
        // TODO -
        return;
    }

    async placeLimitOrder(price: TStockPrice, value: TStockValue): Promise<TStockOrderId> {
        // TODO -
        return;
    }

    async placeMarketOrder(value: TStockValue): Promise<TStockOrderId> {
        // TODO -
        return;
    }

    async placeStopLimitOrder(
        price: TStockPrice,
        trigger: TStockPrice,
        value: TStockValue
    ): Promise<TStockOrderId> {
        // TODO -
        return;
    }

    async placeStopMarketOrder(trigger: TStockPrice, value: TStockValue): Promise<TStockOrderId> {
        // TODO -
        return;
    }

    async placeTakeLimitOrder(
        price: TStockPrice,
        trigger: TStockPrice,
        value: TStockValue
    ): Promise<TStockOrderId> {
        // TODO -
        return;
    }

    async placeTakeMarketOrder(trigger: TStockPrice, value: TStockValue): Promise<TStockOrderId> {
        // TODO -
        return;
    }

    async cancelOrder(orderID: TStockOrderId): Promise<void> {
        // TODO -
        return;
    }

    async hasOrder(orderID: TStockOrderId): Promise<boolean> {
        // TODO -
        return;
    }

    async hardStop(): Promise<void> {
        // TODO -
        return;
    }
}
