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
            const { net, poolID, ownerAddresses = {}, slippageTolerance, decimals } = this.params as any;

            const params: IGetQuoteAddLiquidityRequest = {
                net,
                poolID,
                amount: formatNumber(amount, decimals),
                slippageTolerance,
                tokenAddress: this.tokenAddress,
                ownerAddress: ownerAddresses[net],
            };

            const userBalancePoolList = await this.service.getUserBalancePoolList({ net, ownerAddress: ownerAddresses[net] });

            const poolBalance = userBalancePoolList?.find((elem: IGetUsersPoolListResponse) => elem.address === poolID);

            if (poolBalance && poolBalance.balance < +amount) params.amount = formatNumber(poolBalance.balance, decimals);

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
            this.approveService.params = {
                ...this.params,
                from: { address: poolID },
                typeLp: TRANSACTION_TYPES.REMOVE_LIQUIDITY,
                ownerAddress: this.params.ownerAddresses[net],
            };
            await this.approveService.checkAllowance(store);

            const params: IGetQuoteAddLiquidityRequest = {
                net,
                poolID,
                amount: formatNumber(amount, tokenOut.decimals),
                slippageTolerance,
                tokenAddress: this.tokenAddress,
            };

            const response = await this.service.getQuoteRemoveLiquidity(params);

            const { outputAmount, outputTokenDecimals } = response.data;

            const amountOutput = formatNumber(BigNumber(outputAmount).dividedBy(`1e${outputTokenDecimals}`).toFixed(), outputTokenDecimals);

            this.setParamByField('outputAmount', amountOutput);
        } catch (error) {
            console.error('LiquidityProvider.estimateOutput', error);
            throw error;
        }
    }
}
