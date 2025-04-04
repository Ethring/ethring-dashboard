import ApiClient from '@/modules/pendle-silo/api/axios';
import { ISwapExactTokenForPTRequest, ISwapExactTokenForPTResponse } from '@/modules/pendle-silo/models/request';
import { errorRegister } from '@/shared/utils/errors';

export interface IPendleApi {
    swapExactTokenForPT(params: ISwapExactTokenForPTRequest): Promise<any>;
    addLiquiditySingleToken(params: ISwapExactTokenForPTRequest): Promise<any>;
}

// ============= API Requests Start =============
class PendleApi implements IPendleApi {
    private readonly VERSION = 'v1';

    // swap exact token for pt
    async swapExactTokenForPT(params: ISwapExactTokenForPTRequest): Promise<any> {
        try {
            const response = await ApiClient.get(`/${this.VERSION}/swapExactTokenForPt`, { params });

            const swapExactTokenForPTResponse = response.data as ISwapExactTokenForPTResponse;

            return swapExactTokenForPTResponse;
        } catch (error) {
            console.error('PendleApi.swapExactTokenForPT', error);

            throw Error(errorRegister(error).error);
        }
    }

    // add Liquidity for pool
    async addLiquiditySingleToken(params: ISwapExactTokenForPTRequest): Promise<any> {
        try {
            const response = await ApiClient.get(`/${this.VERSION}/addLiquiditySingleToken`, { params });

            const addLiquiditySingleTokenResponse = response.data as ISwapExactTokenForPTResponse;

            return addLiquiditySingleTokenResponse;
        } catch (error) {
            console.error('PendleApi.addLiquiditySingleToken', error);

            throw Error(errorRegister(error).error);
        }
    }
}
// ============= API Requests End =============

export default PendleApi;
