import ApiClient from '@/modules/portal-fi/api/axios';
import {
    IGetQuoteAddLiquidityRequest,
    IGetQuoteAddLiquidityResponse,
    IGetQuoteRemoveLiquidityResponse,
    IGetAllowanceRequest,
    IGetAllowanceResponse,
    IGetRemoveLiquidityTxRequest,
    IGetUserBalancePoolListRequest,
    IGetPoolListRequest,
    IGetUsersPoolListResponse,
} from '@/modules/portal-fi/models/request.ts';

export interface IPortalFiApi {
    getQuoteAddLiquidity(params: IGetQuoteAddLiquidityRequest): Promise<any>;
    getQuoteRemoveLiquidity(params: IGetQuoteAddLiquidityRequest): Promise<any>;
    getAllowance(params: IGetAllowanceRequest): Promise<any>;
    getApproveTx(params: IGetAllowanceRequest): Promise<any>;
    getAddLiquidityTx(params: IGetQuoteAddLiquidityRequest): Promise<any>;
    getRemoveLiquidityTx(params: IGetRemoveLiquidityTxRequest): Promise<any>;
    getUserBalancePoolList(params: IGetUserBalancePoolListRequest): Promise<IGetUsersPoolListResponse[]>;
    getPoolList(params: IGetPoolListRequest): Promise<any>;
}

// ============= API Requests Start =============
class PortalFiApi implements IPortalFiApi {
    // get allowance amount
    async getAllowance(params: IGetAllowanceRequest): Promise<any> {
        try {
            const response = await ApiClient.get(`/getAllowance`, { params });

            const getAllowanceResponse = response.data as IGetAllowanceResponse;

            return getAllowanceResponse;
        } catch (error) {
            console.error('PortalFiApi.getAllowance', error);

            throw error;
        }
    }

    // get approve tx
    async getApproveTx(params: IGetAllowanceRequest): Promise<any> {
        try {
            const response = await ApiClient.get(`/getApproveTx`, { params });

            const getApproveResponse = response.data as IGetAllowanceResponse;

            return getApproveResponse;
        } catch (error) {
            console.error('PortalFiApi.getApproveTx', error);

            throw error;
        }
    }

    // add liquidity for pool estimate
    async getQuoteAddLiquidity(params: IGetQuoteAddLiquidityRequest): Promise<any> {
        try {
            const response = await ApiClient.get(`/getQuoteAddLiquidity`, { params });

            const addLiquidityResponse = response.data as IGetQuoteAddLiquidityResponse;

            return addLiquidityResponse;
        } catch (error) {
            console.error('PortalFiApi.getQuoteAddLiquidity', error);

            throw error;
        }
    }

    // remove liquidity for pool estimate
    async getQuoteRemoveLiquidity(params: IGetQuoteAddLiquidityRequest): Promise<any> {
        try {
            const response = await ApiClient.get(`/getQuoteRemoveLiquidity`, { params });

            const removeLiquidityResponse = response.data as IGetQuoteRemoveLiquidityResponse;

            return removeLiquidityResponse;
        } catch (error) {
            console.error('PortalFiApi.getQuoteRemoveLiquidity', error);

            throw error;
        }
    }

    // get add liquidity tx
    async getAddLiquidityTx(params: IGetQuoteAddLiquidityRequest): Promise<any> {
        try {
            const response = await ApiClient.get(`/getAddLiquidityTx`, { params });

            return response.data;
        } catch (error) {
            console.error('PortalFiApi.getAddLiquidityTx', error);

            throw error;
        }
    }

    // get remove liquidity tx
    async getRemoveLiquidityTx(params: IGetRemoveLiquidityTxRequest): Promise<any> {
        try {
            const response = await ApiClient.get(`/getRemoveLiquidityTx`, { params });

            return response.data;
        } catch (error) {
            console.error('PortalFiApi.getRemoveLiquidityTx', error);

            throw error;
        }
    }

    // get users pool list
    async getUserBalancePoolList(params: IGetUserBalancePoolListRequest): Promise<any> {
        try {
            const response = await ApiClient.get(`/getUserBalancePoolList`, { params });

            return response.data?.data as IGetUsersPoolListResponse[];
        } catch (error) {
            console.error('PortalFiApi.getUserBalancePoolList', error);

            throw error;
        }
    }

    // get all pools list
    async getPoolList(params: IGetPoolListRequest): Promise<any> {
        try {
            const response = await ApiClient.get(`/getPoolList`, { params });

            return response.data;
        } catch (error) {
            console.error('PortalFiApi.getPoolList', error);

            throw error;
        }
    }
}
// ============= API Requests End =============

export default PortalFiApi;
