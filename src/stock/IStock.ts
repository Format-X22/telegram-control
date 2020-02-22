export type TStockOrderID = string;
export type TStockLastSync = Date | null;
export type TStockLastError = string | null;
export type TStockPrice = number;
export type TStockValue = number;

export type TStockOrder = {
    orderID: TStockOrderID;
};

export type TStockPosition = {
    timestamp: string;
    avgEntryPrice: number;
    liquidationPrice: number;
};

export interface IStock {
    getPosition(): Promise<TStockPosition>;
    getOrders(): Promise<TStockOrder[]>;
    placeOrder(price: TStockPrice, value: TStockValue): Promise<TStockOrder>;
    cancelOrder(orderID: TStockOrderID): Promise<unknown>;
    hasOrder(orderID: TStockOrderID): Promise<boolean>;
    getLastError(): TStockLastError;
}
