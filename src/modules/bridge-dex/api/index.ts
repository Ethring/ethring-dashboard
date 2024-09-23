import ApiClient from '@/modules/bridge-dex/api/axios';

import { IService } from '@/modules/bridge-dex/models/Service.interface';

import { ServiceType } from '@/modules/bridge-dex/enums/ServiceType.enum';
import { GetAllowanceParams, GetApproveTxParams, QuoteParams, SwapTxParams } from '@/modules/bridge-dex/models/Request.type';
import { IBridgeDexTransaction, IQuoteRoutes, ResponseBridgeDex } from '@/modules/bridge-dex/models/Response.interface';

import logger from '@/shared/logger';
import { BaseResponse } from '@/shared/models/types/BaseResponse';

// ============= API Requests Start =============
class BridgeDexApi<T extends ServiceType> {
    /**
     * * Get allowance information for token by serviceId
     * @POST /services/{type}/getAllowance
     * @param {GetAllowanceParams} requestParams
     * @returns {Promise<string>} The allowance amount of the token for the service
     */
    async getAllowance(requestParams: GetAllowanceParams): Promise<ResponseBridgeDex> {
        try {
            const { type, ...params } = requestParams;

            let query = '';

            switch (type) {
                case ServiceType.superswap:
                    query = `/services/${ServiceType.bridgedex}/getAllowance`;
                    break;
                default:
                    query = `/services/${type}/getAllowance`;
                    break;
            }

            const response = await ApiClient.post(query, params);

            const { data: responseData } = response || {};

            const { ok, data, error } = responseData || {};

            return data as string;
        } catch (error) {
            logger.error('(API) -> [BRIDGE_DEX_API] Error fetching allowance', error);
            throw error;
        }
    }

    /**
     * * Get approve transaction for token by serviceId
     * @POST /services/{type}/getApproveTx
     * @param {GetApproveTxParams} requestParams
     * @returns {Promise<IBridgeDexTransaction[]>} Approving transaction/transactions for the token requested for the service
     */
    async getApproveTx(requestParams: GetApproveTxParams): Promise<ResponseBridgeDex> {
        try {
            const { type, ...params } = requestParams;

            let query = '';
            switch (type) {
                case ServiceType.superswap:
                    query = `/services/${ServiceType.bridgedex}/getApproveTx`;
                    break;
                default:
                    query = `/services/${type}/getApproveTx`;
                    break;
            }

            const response = await ApiClient.post(query, params);

            const { data: responseData } = response || {};
            const { ok, data, error } = responseData || {};

            return data as IBridgeDexTransaction[];
        } catch (error) {
            logger.error('(API) -> [BRIDGE_DEX_API] Error fetching approve tx', error);
            throw error;
        }
    }

    /**
     * * Get swap transaction for token by serviceId
     * @POST /services/{type}/getSwapTx
     * @param {GetSwapTxParams} requestParams
     * @returns {Promise<IBridgeDexTransaction[]>} Swap transaction/transactions for the token requested for the service
     */
    async getSwapTx(requestParams: SwapTxParams<T>): Promise<ResponseBridgeDex> {
        try {
            const { type, ...params } = requestParams;

            let query = '';

            switch (type) {
                case ServiceType.superswap:
                    query = `/services/${ServiceType.bridgedex}/getSwapTx`;
                    break;
                default:
                    query = `/services/${type}/getSwapTx`;
                    break;
            }

            const response = (await ApiClient.post(query, params)) as BaseResponse;

            const { data: responseData } = response || {};

            const { ok, data, error } = responseData || {};

            return data as IBridgeDexTransaction[];
        } catch (error) {
            logger.error('(API) -> [BRIDGE_DEX_API] Error fetching Swap tx', error);
            throw error;
        }
    }

    /**
     * * Get quote for requested token params
     * @POST /services/{type}/getQuote
     * @param {GetQuoteParams} requestParams
     * @returns {Promise<IQuoteRoutes>} Routes with the best quote and all available routes
     */
    async getQuote(requestParams: QuoteParams<T>, controller: AbortController): Promise<ResponseBridgeDex> {
        try {
            const { type, ...params } = requestParams;

            if (params.routeId) delete params.routeId;

            let query = '';

            switch (type) {
                case ServiceType.superswap:
                    query = `/services/${ServiceType.bridgedex}/getQuote`;
                    break;
                default:
                    query = `/services/${type}/getQuote`;
                    break;
            }

            const response = await ApiClient.post(query, params, {
                signal: controller.signal,
            });

            const { data: responseData } = (response as BaseResponse) || {};

            const { ok, data, error } = responseData || {};

            return data as IQuoteRoutes;
        } catch (error: any) {
            if (error?.code === 'ERR_CANCELLED') return {} as IQuoteRoutes;
            logger.error('(API) -> [BRIDGE_DEX_API] Error fetching quote', error);
            throw error;
        }
    }
}
// ============= API Requests End =============

/**
 * * Get all services from the BridgeDex API
 * @GET /services
 * @returns {Promise<IService[]>} List of services
 */
export const getAllServices = async (): Promise<IService[]> => {
    try {
        const response = await ApiClient.get('/services');

        const { data: responseData } = (response as BaseResponse) || {};

        const { ok, data, error } = responseData || {};

        return data as IService[];
    } catch (error) {
        logger.error('(API) -> [BRIDGE_DEX_API] Error fetching services', error);
        return [];
    }
};

export default BridgeDexApi;
