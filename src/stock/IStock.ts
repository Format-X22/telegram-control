export type TStockLastError = string | null;
export type TStockPrice = number;
export type TStockValue = number;

export interface IStock<TStockUserData, TStockPosition, TStockOrder, TStockOrderId> {
    getUserData(): Promise<TStockUserData>;
    getPosition(): Promise<TStockPosition>;
    getOrders(): Promise<TStockOrder[]>;
    placeLimitOrder(price: TStockPrice, value: TStockValue): Promise<TStockOrder>;
    placeMarketOrder(price: TStockPrice, value: TStockValue): Promise<TStockOrder>;
    placeStopLimitOrder(
        price: TStockPrice,
        trigger: TStockPrice,
        value: TStockValue
    ): Promise<TStockOrder>;
    placeStopMarketOrder(
        trigger: TStockPrice,
        value: TStockValue
    ): Promise<TStockOrder>;
    placeTakeLimitOrder(
        price: TStockPrice,
        trigger: TStockPrice,
        value: TStockValue
    ): Promise<TStockOrder>;
    placeTakeMarketOrder(
        trigger: TStockPrice,
        value: TStockValue
    ): Promise<TStockOrder>;
    cancelOrder(orderID: TStockOrderId): Promise<unknown>;
    hasOrder(orderID: TStockOrderId): Promise<boolean>;
    getLastError(): TStockLastError;
}
