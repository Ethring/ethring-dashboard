import { pick } from 'lodash/object';

import BridgeDexApi from '@/modules/bridge-dex/api';

import { ServiceType } from '@/modules/bridge-dex/enums/ServiceType.enum';
import {
    GetAllowanceParams,
    GetApproveTxParams,
    GetSwapTxParams,
    QuoteParamsKeys,
    SwapTxParams,
} from '@/modules/bridge-dex/models/Request.type';

import { ErrorResponse, IBridgeDexTransaction, IQuoteRoutes } from '@/modules/bridge-dex/models/Response.interface';
import logger from '@/shared/logger';
import { AllQuoteParams, QuoteParams } from './models/Request.type';
import { NATIVE_CONTRACT } from '@/core/wallet-adapter/config';

export interface IBridgeDexService {
    getAllowance(params: GetAllowanceParams): Promise<string>;
    getApproveTx(params: GetApproveTxParams): Promise<IBridgeDexTransaction[]>;
    getSwapTx(params: GetSwapTxParams): Promise<IBridgeDexTransaction[]>;
    getQuote(params: AllQuoteParams, options?: { withServiceId: boolean }): Promise<IQuoteRoutes>;
    getQuoteSuperSwap(params: QuoteParams<ServiceType>): Promise<IQuoteRoutes>;
}

class BridgeDexService<T extends ServiceType> implements IBridgeDexService {
    private serviceId: string = '';
    private api: BridgeDexApi<T>;

    constructor(
        private type: T,
        serviceId: string = '',
    ) {
        serviceId && (this.serviceId = serviceId);
        this.api = new BridgeDexApi<T>();
    }

    setServiceId(serviceId: string): void {
        this.serviceId = serviceId;
    }

    async getAllowance(params: GetAllowanceParams) {
        try {
            return (await this.api.getAllowance({ ...params, type: this.type, serviceId: this.serviceId })) as string;
        } catch (error) {
            logger.error('(MODULE) -> [BRIDGE_DEX_SERVICE] Error fetching allowance', error);
            throw error as ErrorResponse;
        }
    }

    async getApproveTx(params: GetApproveTxParams) {
        try {
            return (await this.api.getApproveTx({ ...params, type: this.type, serviceId: this.serviceId })) as IBridgeDexTransaction[];
        } catch (error) {
            logger.error('(MODULE) -> [BRIDGE_DEX_SERVICE] Error fetching approve tx', error);
            throw error as ErrorResponse;
        }
    }

    async getSwapTx(params: GetSwapTxParams) {
        const requestParams = pick(params, QuoteParamsKeys[this.type]) as SwapTxParams<T>;

        requestParams.type = this.type;

        this.serviceId && (requestParams.serviceId = this.serviceId);

        !requestParams.toToken && (requestParams.toToken = NATIVE_CONTRACT);
        !requestParams.fromToken && (requestParams.fromToken = NATIVE_CONTRACT);

        try {
            return (await this.api.getSwapTx(requestParams)) as IBridgeDexTransaction[];
        } catch (error) {
            logger.error('(MODULE) -> [BRIDGE_DEX_SERVICE] Error fetching swap tx', error);
            throw error as ErrorResponse;
        }
    }

    async getQuote(params: AllQuoteParams, { withServiceId = false, controller = new AbortController() } = {}) {
        const requestParams = pick(params, QuoteParamsKeys[this.type]) as QuoteParams<T>;

        requestParams.type = this.type;

        !requestParams.toToken && (requestParams.toToken = NATIVE_CONTRACT);
        !requestParams.fromToken && (requestParams.fromToken = NATIVE_CONTRACT);

        withServiceId && this.serviceId && (requestParams.serviceId = this.serviceId);

        try {
            const routes = (await this.api.getQuote(requestParams, controller)) as IQuoteRoutes;

            routes.routes = routes.routes.map((route) => {
                route.routeId = routes.routeId;
                return route;
            });

            return routes;
        } catch (error) {
            logger.error('(MODULE) -> [BRIDGE_DEX_SERVICE] Error fetching quote', error);
            throw error as ErrorResponse;
        }
    }

    async getQuoteSuperSwap(params: QuoteParams<T>) {
        try {
            return (await this.api.getQuote({ ...params, type: this.type, serviceId: this.serviceId })) as IQuoteRoutes;
        } catch (error) {
            logger.error('(MODULE) -> [BRIDGE_DEX_SERVICE] Error fetching quote for super swap', error);
            throw error as ErrorResponse;
        }
    }

    async callMethod(method: string, params: any): Promise<IBridgeDexTransaction[] | IQuoteRoutes> {
        // @ts-expect-error-next-line
        if (!this[method as any]) throw new Error(`Method ${method} not found`);
        if (!params) throw new Error('Params are required');

        try {
            if (method === 'getQuote' || method === 'getQuoteSuperSwap')
                return (await this[method](params, { withServiceId: true })) as IQuoteRoutes;

            // @ts-expect-error-next-line
            return (await this[method](params)) as IBridgeDexTransaction[];
        } catch (error) {
            logger.error('(MODULE) -> [BRIDGE_DEX_SERVICE] Error calling method', error);
            throw error as ErrorResponse;
        }
    }
}

export default BridgeDexService;
