import { BaseOpParams } from '@/core/operations/models/Operations';
import { AllQuoteParams } from '@/modules/bridge-dex/models/Request.type';
import { BaseOperation } from '@/core/operations/BaseOperation';

import { TRANSACTION_TYPES } from '@/core/operations/models/enums/tx-types.enum';
import { ModuleType } from '@/shared/models/enums/modules.enum';
import { TxOperationFlow } from '@/shared/models/types/Operations';

import PortalFiApi, { IPortalFiApi } from '@/modules/portal-fi/api';
import { IGetQuoteAddLiquidityRequest } from '@/modules/portal-fi/models/request';
import ApproveLpOperation from './ApproveLp';

import BigNumber from 'bignumber.js';

export default class PortalFiAddLiquidity extends BaseOperation {
    module: keyof typeof ModuleType = ModuleType.liquidityProvider;

    params: BaseOpParams = {} as AllQuoteParams;

    flow: TxOperationFlow[] = [];

    service: IPortalFiApi;
    approveService: ApproveLpOperation;

    constructor() {
        super();
        super.setTxType(TRANSACTION_TYPES.ADD_LIQUIDITY);
        this.service = new PortalFiApi();
        this.approveService = new ApproveLpOperation();
    }

    async performTx() {
        const amount = this.getParamByField('amount');

        if (!amount) {
            console.warn('Amount is required');
            return;
        }

        try {
            const { net, poolID, ownerAddresses = {}, slippageTolerance } = this.params as any;

            const { from } = this.getTokens();

            const { address } = from || {};
            const tokenIn = address || '0x0000000000000000000000000000000000000000';

            const params: IGetQuoteAddLiquidityRequest = {
                net,
                poolID,
                amount,
                slippageTolerance,
                tokenAddress: tokenIn,
                ownerAddress: ownerAddresses[net],
            };
            const response = await this.service.getAddLiquidityTx(params);

            return response.data[0];
        } catch (error) {
            console.error('LiquidityProvider.performTx', error);
            throw error;
        }
    }

    getOperationFlow(): TxOperationFlow[] {
        this.flow = [
            {
                type: this.transactionType,
                make: TRANSACTION_TYPES.DEPOSIT,
                moduleIndex: this.getModule(),
            },
        ];

        return this.flow;
    }

    async estimateOutput(store: Storage): Promise<void> {
        const amount = this.getParamByField('amount');

        if (!amount) {
            console.warn('Amount is required');
            return;
        }

        try {
            const { net, poolID, slippageTolerance } = this.params as any;

            const { from } = this.getTokens();

            const { address } = from || {};
            const tokenIn = address || '0x0000000000000000000000000000000000000000';

            // Check allowance
            this.approveService.params = { ...this.params, from };
            await this.approveService.checkAllowance();

            store.dispatch('moduleStates/setIsNeedApproveLP', this.approveService.isNeedApprove);

            const params: IGetQuoteAddLiquidityRequest = {
                net,
                poolID,
                amount,
                slippageTolerance,
                tokenAddress: tokenIn,
            };

            const response = await this.service.getQuoteAddLiquidity(params);

            const outputAmount = BigNumber(response.data?.outputAmount).dividedBy(`1e${response.data?.outputTokenDecimals}`).toFixed(8);

            this.setParamByField('outputAmount', outputAmount);
        } catch (error) {
            console.error('LiquidityProvider.estimateOutput', error);
            throw error;
        }
    }
}
