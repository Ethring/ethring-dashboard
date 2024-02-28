import ApiClient from '@/modules/bridge-dex/api/axios';

import { IService } from '@/modules/bridge-dex/models/Service.interface';

import { ServiceType } from '@/modules/bridge-dex/enums/ServiceType.enum';
import {
    GetAllowanceParams,
    GetApproveTxParams,
    GetSwapTxParams,
    QuoteParams,
    SwapTxParams,
} from '@/modules/bridge-dex/models/Request.type';
import { IBridgeDexTransaction, ErrorResponse, IQuoteRoutes, ResponseBridgeDex } from '@/modules/bridge-dex/models/Response.interface';

import logger from '@/shared/logger';

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
            return (await ApiClient.post(`/services/${type}/getAllowance`, params)) as string;
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
            return (await ApiClient.post(`/services/${type}/getApproveTx`, params)) as IBridgeDexTransaction[];
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
            return (await ApiClient.post(`/services/${type}/getSwapTx`, params)) as IBridgeDexTransaction[];
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
    async getQuote(requestParams: QuoteParams<T>): Promise<ResponseBridgeDex> {
        try {
            const { type, ...params } = requestParams;
            return (await ApiClient.post(`/services/${type}/getQuote`, params)) as IQuoteRoutes;
        } catch (error) {
            logger.error('(API) -> [BRIDGE_DEX_API] Error fetching quote', error);
            throw error;
        }
    }

    /**
     * * Get quote for requested token params
     * @POST /services/{type}/getQuote
     * @param {GetQuoteParams} requestParams
     * @returns {Promise<IQuoteRoutes>} Routes with the best quote and all available routes
     */
    async getQuoteSuperSwap(requestParams: QuoteParams<T>): Promise<ResponseBridgeDex> {
        try {
            return (await ApiClient.post(`/services/superswap/getQuote`, requestParams)) as IQuoteRoutes;
        } catch (error) {
            logger.error('(API) -> [BRIDGE_DEX_API] Error fetching quote for SuperSWAP', error);
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
        return (await ApiClient.get('/services')) as IService[];
    } catch (error) {
        logger.error('(API) -> [BRIDGE_DEX_API] Error fetching services', error);
        return [];
    }
};

export default BridgeDexApi;
