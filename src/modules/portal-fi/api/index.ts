import { portalApiClient, PortalApiInstance, DpApiInstance } from '@/modules/portal-fi/api/axios';
import {
    IGetQuoteAddLiquidityRequest,
    IGetQuoteAddLiquidityResponse,
    IGetQuoteRemoveLiquidityResponse,
    IGetAllowanceRequest,
    IGetAllowanceResponse,
    IGetUserBalancePoolListRequest,
    IGetPoolListRequest,
    IGetUsersPoolListResponse,
} from '@/modules/portal-fi/models/request';

import { errorRegister } from '@/shared/utils/errors';

export interface IPortalFiApi {
    getQuoteAddLiquidity(params: IGetQuoteAddLiquidityRequest, controller: AbortController): Promise<any>;
    getQuoteRemoveLiquidity(params: IGetQuoteAddLiquidityRequest, controller: AbortController): Promise<any>;
    getAllowance(params: IGetAllowanceRequest): Promise<any>;
    getApproveTx(params: IGetAllowanceRequest): Promise<any>;
    getAddLiquidityTx(params: IGetQuoteAddLiquidityRequest): Promise<any>;
    getRemoveLiquidityTx(params: IGetQuoteAddLiquidityRequest): Promise<any>;
    getUserBalancePoolList(params: IGetUserBalancePoolListRequest): Promise<IGetUsersPoolListResponse[]>;
    getPoolList(params: IGetPoolListRequest): Promise<any>;
}

// ============= API Requests Start =============
class PortalFiApi implements IPortalFiApi {
    // get allowance amount
    async getAllowance(params: IGetAllowanceRequest): Promise<any> {
        try {
            const response = await PortalApiInstance.get(`/getAllowance`, { params });

            const getAllowanceResponse = response.data as IGetAllowanceResponse;

            return getAllowanceResponse;
        } catch (error) {
            console.error('PortalFiApi.getAllowance', error);
            portalApiClient.handleRequestError(error);
        }
    }

    // get approve tx
    async getApproveTx(params: IGetAllowanceRequest): Promise<any> {
        try {
            const response = await PortalApiInstance.get(`/getApproveTx`, { params });

            const getApproveResponse = response.data as IGetAllowanceResponse;

            return getApproveResponse;
        } catch (error) {
            console.error('PortalFiApi.getApproveTx', error);
            portalApiClient.handleRequestError(error);
        }
    }

    // add liquidity for pool estimate
    async getQuoteAddLiquidity(params: IGetQuoteAddLiquidityRequest, controller: AbortController): Promise<any> {
        try {
            const response = await PortalApiInstance.get(`/getQuoteAddLiquidity`, { params, signal: controller.signal });

            if (!response?.data) {
                console.warn('PortalFiApi.getQuoteAddLiquidity', 'No data');
                return;
            }

            return response.data as IGetQuoteAddLiquidityResponse;
        } catch (error) {
            console.error('PortalFiApi.getQuoteAddLiquidity', error);
            portalApiClient.handleRequestError(error);
        }
    }

    // remove liquidity for pool estimate
    async getQuoteRemoveLiquidity(params: IGetQuoteAddLiquidityRequest, controller: AbortController): Promise<any> {
        try {
            const response = await PortalApiInstance.get(`/getQuoteRemoveLiquidity`, { params, signal: controller.signal });

            if (!response?.data) {
                console.warn('PortalFiApi.getQuoteRemoveLiquidity', 'No data');
                return;
            }

            return response.data as IGetQuoteRemoveLiquidityResponse;
        } catch (error) {
            console.error('PortalFiApi.getQuoteRemoveLiquidity', error);
            portalApiClient.handleRequestError(error);
        }
    }

    // get add liquidity tx
    async getAddLiquidityTx(params: IGetQuoteAddLiquidityRequest): Promise<any> {
        try {
            const response = await PortalApiInstance.get(`/getAddLiquidityTx`, { params });
            return response.data;
        } catch (error) {
            console.error('PortalFiApi.getAddLiquidityTx', error);
            portalApiClient.handleRequestError(error);
        }
    }

    // get remove liquidity tx
    async getRemoveLiquidityTx(params: IGetQuoteAddLiquidityRequest): Promise<any> {
        try {
            const response = await PortalApiInstance.get(`/getRemoveLiquidityTx`, { params });

            return response.data;
        } catch (error) {
            console.error('PortalFiApi.getRemoveLiquidityTx', error);
            portalApiClient.handleRequestError(error);
        }
    }

    // get users pool list
    async getUserBalancePoolList(params: IGetUserBalancePoolListRequest): Promise<any> {
        try {
            const response = await DpApiInstance.get(`/balances?provider=Portal&integrations=true`, {
                params,
            });

            return response.data?.data?.integrations as IGetUsersPoolListResponse[];
        } catch (error) {
            console.error('PortalFiApi.getUserBalancePoolList', error);
            portalApiClient.handleRequestError(error);
        }
    }

    // get all pools list
    async getPoolList(params: IGetPoolListRequest): Promise<any> {
        try {
            const response = await PortalApiInstance.get(`/getPoolList`, { params });

            return response.data;
        } catch (error) {
            console.error('PortalFiApi.getPoolList', error);
            portalApiClient.handleRequestError(error);
        }
    }
}
// ============= API Requests End =============

export default PortalFiApi;
