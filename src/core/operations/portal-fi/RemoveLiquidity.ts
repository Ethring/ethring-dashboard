import { BaseOpParams } from '@/core/operations/models/Operations';
import { AllQuoteParams } from '@/modules/bridge-dex/models/Request.type';
import { BaseOperation } from '@/core/operations/BaseOperation';

import { TRANSACTION_TYPES } from '@/core/operations/models/enums/tx-types.enum';
import { ModuleType } from '@/shared/models/enums/modules.enum';
import { TxOperationFlow } from '@/shared/models/types/Operations';

import PortalFiApi, { IPortalFiApi } from '@/modules/portal-fi/api';
import { IGetQuoteAddLiquidityRequest, IGetUsersPoolListResponse } from '@/modules/portal-fi/models/request';
import ApproveLpOperation from './ApproveLp';

import BigNumber from 'bignumber.js';
import { formatNumber } from '@/shared/utils/numbers';

export default class PortalFiRemoveLiquidity extends BaseOperation {
    module: keyof typeof ModuleType = ModuleType.liquidityProvider;

    params: BaseOpParams = {} as AllQuoteParams;

    flow: TxOperationFlow[] = [];

    service: IPortalFiApi;
    tokenAddress: string = '';
    approveService: ApproveLpOperation;

    constructor() {
        super();
        super.setTxType(TRANSACTION_TYPES.REMOVE_LIQUIDITY);
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

            const params: IGetQuoteAddLiquidityRequest = {
                net,
                poolID,
                amount,
                slippageTolerance,
                tokenAddress: this.tokenAddress,
                ownerAddress: ownerAddresses[net],
            };

            const userBalancePoolList = await this.service.getUserBalancePoolList({ net, ownerAddress: ownerAddresses[net] });

            const poolBalance = userBalancePoolList?.find((elem: IGetUsersPoolListResponse) => elem.address === poolID);

            if (poolBalance && poolBalance.balance < +amount) params.amount = poolBalance.balance;

            const response = await this.service.getRemoveLiquidityTx(params);

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

            const tokenOut = store.getters['tokenOps/srcToken'];
            this.tokenAddress = tokenOut.address || '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

            // Check allowance
            this.approveService.params = { ...this.params, from: { address: poolID } };
            await this.approveService.checkAllowance();

            store.dispatch('moduleStates/setIsNeedRemoveLPApprove', this.approveService.isNeedApprove);

            const params: IGetQuoteAddLiquidityRequest = {
                net,
                poolID,
                amount: formatNumber(amount, tokenOut.decimals),
                slippageTolerance,
                tokenAddress: this.tokenAddress,
            };

            const response = await this.service.getQuoteRemoveLiquidity(params);

            const outputAmount = BigNumber(response.data?.outputAmount).dividedBy(`1e${response.data?.outputTokenDecimals}`).toFixed(8);

            this.setParamByField('outputAmount', outputAmount);
        } catch (error) {
            console.error('LiquidityProvider.estimateOutput', error);
            throw error;
        }
    }
}
