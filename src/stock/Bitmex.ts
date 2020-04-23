import * as crypto from 'crypto';
import * as request from 'request-promise-native';
import { EventLoop } from '../utils/EventLoop';
import { config } from '../data/config';
import { IStock, TStockLeverage, TStockOrderId, TStockPrice, TStockValue } from './Stock';
import { IWorker } from '../workers/Worker';

type TBitmexOrderId = string;
type TOrder = {
    ordType: string;
    orderQty: number;
    orderID?: TBitmexOrderId;
    symbol?: string;
    timeInForce?: string;
    execInst?: string;
    price?: number;
    stopPx?: number;
};
type TOrders = Map<TStockOrderId, TBitmexOrderId>;
type TMarginData = {
    marginLeverage: number;
};
type TAuthHeaders = {
    'content-type': 'application/json';
    Accept: 'application/json';
    'X-Requested-With': 'XMLHttpRequest';
    'api-expires': number;
    'api-key': string;
    'api-signature': string;
};
type THttpRequestData = {
    headers: TAuthHeaders;
    url: string;
    method: string;
    body: string;
};
type TRequestOptions = {
    point: string;
    method: string;
    params: unknown;
};

const DOMAIN: string = 'https://www.bitmex.com';
const API_POINT: string = '/api/v1/';
const REQUEST_RETRY_SLEEP: number = 3000;
export const ONE_SECOND: number = 1000;
export const MINUTE_IN_SECONDS: number = 60;

let lastOrderId: number = 0;

export class Bitmex implements IStock {
    private readonly publicKey: string;
    private readonly privateKey: string;
    private readonly orders: TOrders = new Map<TStockOrderId, TBitmexOrderId>();
    private isHardStop: boolean = false;

    constructor(private worker: IWorker) {
        this.publicKey = config.bitmexPublicKey;
        this.privateKey = config.bitmexPrivateKey;
    }

    async getLeverage(): Promise<TStockLeverage> {
        const marginData: TMarginData = await this.request<TMarginData>({
            point: 'user/margin',
            method: 'GET',
            params: {},
        });

        return marginData.marginLeverage;
    }

    async getOrders(): Promise<TStockOrderId[]> {
        const orders: TOrder[] = await this.request<TOrder[]>({
            point: 'order',
            method: 'GET',
            params: { symbol: 'XBTUSD', filter: { open: true } },
        });

        const result: TStockOrderId[] = [];
        const forRemove: TStockOrderId[] = [];

        for (const [orderId, bitmexOrderId] of this.orders) {
            let included: boolean = false;

            for (const bitmexOrder of orders) {
                if (bitmexOrder.orderID === bitmexOrderId) {
                    result.push(orderId);

                    included = true;
                    break;
                }
            }

            if (!included) {
                forRemove.push(orderId);
            }
        }

        for (const id of forRemove) {
            this.orders.delete(id);
        }

        return result;
    }

    async placeLimitOrder(price: TStockPrice, value: TStockValue): Promise<TStockOrderId> {
        return await this.placeOrder({
            ordType: 'Limit',
            orderQty: value,
            price,
        });
    }

    async placeMarketOrder(value: TStockValue): Promise<TStockOrderId> {
        return await this.placeOrder({
            ordType: 'Market',
            orderQty: value,
        });
    }

    async placeStopLimitOrder(
        price: TStockPrice,
        trigger: TStockPrice,
        value: TStockValue
    ): Promise<TStockOrderId> {
        return await this.placeOrder({
            ordType: 'StopLimit',
            orderQty: value,
            stopPx: trigger,
            price,
            execInst: 'LastPrice',
        });
    }

    async placeStopMarketOrder(trigger: TStockPrice, value: TStockValue): Promise<TStockOrderId> {
        return await this.placeOrder({
            ordType: 'Stop',
            orderQty: value,
            stopPx: trigger,
            execInst: 'LastPrice',
        });
    }

    async placeTakeLimitOrder(
        price: TStockPrice,
        trigger: TStockPrice,
        value: TStockValue
    ): Promise<TStockOrderId> {
        return await this.placeOrder({
            ordType: 'LimitIfTouched',
            orderQty: value,
            stopPx: trigger,
            price,
            execInst: 'LastPrice',
        });
    }

    async placeTakeMarketOrder(trigger: TStockPrice, value: TStockValue): Promise<TStockOrderId> {
        return await this.placeOrder({
            ordType: 'MarketIfTouched',
            orderQty: value,
            stopPx: trigger,
            execInst: 'LastPrice',
        });
    }

    async cancelOrder(orderId: TStockOrderId): Promise<void> {
        const bitmexOrderId: TBitmexOrderId = this.orders.get(orderId);
        const orders: TOrder[] = await this.request<TOrder[]>({
            point: 'order',
            method: 'DELETE',
            params: { orderID: bitmexOrderId },
        });

        if (!Array.isArray(orders) || orders.length < 0) {
            console.error(orders);

            this.worker.lastStockError = JSON.stringify(orders, null, 2);

            return await this.cancelOrder(orderId);
        }

        this.orders.delete(orderId);
    }

    async hasOrder(orderId: TStockOrderId): Promise<boolean> {
        const ids: TStockOrderId[] = await this.getOrders();

        return ids.includes(orderId);
    }

    async hardStop(): Promise<void> {
        this.isHardStop = true;
    }

    private async placeOrder(params: TOrder): Promise<TStockOrderId> {
        const order: TOrder = await this.request<TOrder>({
            point: 'order',
            method: 'POST',
            params: this.appendOrderStaticParams(params),
        });

        if (!order.orderID) {
            console.error(order);

            this.worker.lastStockError = JSON.stringify(order, null, 2);

            return await this.placeOrder(params);
        }

        const orderId: number = lastOrderId++;

        this.orders.set(orderId, order.orderID);

        return orderId;
    }

    private appendOrderStaticParams(params: TOrder): TOrder {
        params.symbol = 'XBTUSD';
        params.timeInForce = 'GoodTillCancel';

        return params;
    }

    private async request<T>(args: TRequestOptions): Promise<T> {
        while (!this.isHardStop) {
            try {
                return await this.tryRequest<T>(args);
            } catch (error) {
                const now: Date = new Date();

                console.log(now, error);
                this.worker.lastStockError = `${now} :: ${error.message}`;

                await EventLoop.sleep(REQUEST_RETRY_SLEEP);
            }
        }

        throw new Error('Hard stop');
    }

    private async tryRequest<T>({ point, method, params }: TRequestOptions): Promise<T> {
        const path: string = `${API_POINT}${point}`;
        const expires: number = Math.round(new Date().getTime() / ONE_SECOND) + MINUTE_IN_SECONDS;
        const body: string = JSON.stringify(params);

        const signature: string = crypto
            .createHmac('sha256', this.privateKey)
            .update(`${method}${path}${expires}${body}`)
            .digest('hex');

        const headers: TAuthHeaders = {
            'content-type': 'application/json',
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'api-expires': expires,
            'api-key': this.publicKey,
            'api-signature': signature,
        };

        const requestOptions: THttpRequestData = {
            headers: headers,
            url: `${DOMAIN}${path}`,
            method,
            body: body,
        };

        return JSON.parse(await request(requestOptions));
    }
}
