import {
    IStock,
    TStockLastError,
    TStockOrder,
    TStockOrderID,
    TStockPosition,
    TStockPrice,
    TStockValue,
} from './IStock';

export class Binance implements IStock {
    constructor() {
        // TODO -
    }

    async getPosition(): Promise<TStockPosition> {
        // TODO -
        return;
    }

    async getOrders(): Promise<TStockOrder[]> {
        // TODO -
        return;
    }

    async placeOrder(price: TStockPrice, value: TStockValue): Promise<TStockOrder> {
        // TODO -
        return;
    }

    async cancelOrder(orderID: TStockOrderID): Promise<unknown> {
        // TODO -
        return;
    }

    async hasOrder(orderID: TStockOrderID): Promise<boolean> {
        // TODO -
        return;
    }

    getLastError(): TStockLastError {
        // TODO -
        return;
    }
}
