import * as crypto from 'crypto';
import * as request from 'request-promise-native';
import { EventLoop } from '../utils/EventLoop';
import { config } from '../data/config';
import { IStock, TStockLastError, TStockPrice, TStockValue } from './IStock';

type TStockOrderId = string;
type TStockOrder = {
    ordType: string;
    orderQty: number;
    orderID?: TStockOrderId;
    symbol?: string;
    timeInForce?: string;
    execInst?: string;
    price?: number;
    stopPx?: number;
};
type TStockPosition = {};
type TStockMarginData = {
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

export class Bitmex
    implements IStock<TStockMarginData, TStockPosition, TStockOrder, TStockOrderId> {
    private lastError?: TStockLastError;
    private readonly publicKey: string;
    private readonly privateKey: string;

    constructor() {
        this.publicKey = config.bitmexPublicKey;
        this.privateKey = config.bitmexPrivateKey;
    }

    async getMarginData(): Promise<TStockMarginData> {
        return await this.request<TStockMarginData>({
            point: 'user/margin',
            method: 'GET',
            params: {},
        });
    }

    async getPosition(): Promise<TStockPosition> {
        const positions: TStockPosition[] = await this.request<TStockPosition[]>({
            point: 'position',
            method: 'GET',
            params: { filter: { symbol: 'XBTUSD' } },
        });

        return positions[0];
    }

    async getOrders(): Promise<TStockOrder[]> {
        return await this.request<TStockOrder[]>({
            point: 'order',
            method: 'GET',
            params: { symbol: 'XBTUSD', filter: { open: true } },
        });
    }

    async placeLimitOrder(price: TStockPrice, value: TStockValue): Promise<TStockOrder> {
        return await this.request<TStockOrder>({
            point: 'order',
            method: 'POST',
            params: this.appendOrderStaticParams({
                ordType: 'Limit',
                orderQty: value,
                price,
            }),
        });
    }

    async placeMarketOrder(value: TStockValue): Promise<TStockOrder> {
        return await this.request<TStockOrder>({
            point: 'order',
            method: 'POST',
            params: this.appendOrderStaticParams({
                ordType: 'Market',
                orderQty: value,
            }),
        });
    }

    async placeStopLimitOrder(
        price: TStockPrice,
        trigger: TStockPrice,
        value: TStockValue
    ): Promise<TStockOrder> {
        return await this.request<TStockOrder>({
            point: 'order',
            method: 'POST',
            params: this.appendOrderStaticParams({
                ordType: 'StopLimit',
                orderQty: value,
                stopPx: trigger,
                price,
                execInst: 'LastPrice',
            }),
        });
    }

    async placeStopMarketOrder(trigger: TStockPrice, value: TStockValue): Promise<TStockOrder> {
        return await this.request<TStockOrder>({
            point: 'order',
            method: 'POST',
            params: this.appendOrderStaticParams({
                ordType: 'Stop',
                orderQty: value,
                stopPx: trigger,
                execInst: 'LastPrice',
            }),
        });
    }

    async placeTakeLimitOrder(
        price: TStockPrice,
        trigger: TStockPrice,
        value: TStockValue
    ): Promise<TStockOrder> {
        return await this.request<TStockOrder>({
            point: 'order',
            method: 'POST',
            params: this.appendOrderStaticParams({
                ordType: 'LimitIfTouched',
                orderQty: value,
                stopPx: trigger,
                price,
                execInst: 'LastPrice',
            }),
        });
    }

    async placeTakeMarketOrder(trigger: TStockPrice, value: TStockValue): Promise<TStockOrder> {
        return await this.request<TStockOrder>({
            point: 'order',
            method: 'POST',
            params: this.appendOrderStaticParams({
                ordType: 'MarketIfTouched',
                orderQty: value,
                stopPx: trigger,
                execInst: 'LastPrice',
            }),
        });
    }

    async cancelOrder(orderID: TStockOrderId): Promise<unknown> {
        return await this.request({
            point: 'order',
            method: 'DELETE',
            params: { orderID },
        });
    }

    async hasOrder(orderID: TStockOrderId): Promise<boolean> {
        const orders: TStockOrder[] = await this.getOrders();

        for (const order of orders) {
            if (order.orderID === orderID) {
                return true;
            }
        }

        return false;
    }

    getLastError(): TStockLastError {
        return this.lastError;
    }

    private appendOrderStaticParams(params: TStockOrder): TStockOrder {
        params.symbol = 'XBTUSD';
        params.timeInForce = 'GoodTillCancel';

        return params;
    }

    private async request<T>(args: TRequestOptions): Promise<T> {
        while (true) {
            try {
                return await this.tryRequest<T>(args);
            } catch (error) {
                const now: Date = new Date();

                console.log(now, error);
                this.lastError = `${now} :: ${error.message}`;

                await EventLoop.sleep(REQUEST_RETRY_SLEEP);
            }
        }
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
