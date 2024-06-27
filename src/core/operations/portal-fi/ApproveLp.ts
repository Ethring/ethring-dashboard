import { BaseOpParams } from '@/core/operations/models/Operations';
import { BaseOperation } from '@/core/operations/BaseOperation';
import { AllQuoteParams } from '@/modules/bridge-dex/models/Request.type';
import { IBridgeDexTransaction } from '@/modules/bridge-dex/models/Response.interface';
import { TxOperationFlow } from '@/shared/models/types/Operations';

import { TRANSACTION_TYPES } from '@/core/operations/models/enums/tx-types.enum';

import { IGetAllowanceRequest } from '@/modules/portal-fi/models/request';
import PortalFiApi, { IPortalFiApi } from '@/modules/portal-fi/api';
import { formatNumber } from '@/shared/utils/numbers';

type Allowance = {
    [key: string]: number;
};
export default class ApproveLpOperation extends BaseOperation {
    flow: TxOperationFlow[] = [];
    params: BaseOpParams = {} as AllQuoteParams;
    service: IPortalFiApi;
    isNeedApprove: boolean = true;
    allowance: Allowance = {};

    constructor() {
        super();

        super.setTxType(TRANSACTION_TYPES.APPROVE);
        this.service = new PortalFiApi();
    }

    async performTx(): Promise<IBridgeDexTransaction | null> {
        const amount = this.getParamByField('amount');

        const { net, ownerAddress, tokenAddress } = this.params as any;
        const { from } = this.getTokens();

        const params: IGetAllowanceRequest = {
            net,
            amount: formatNumber(amount, from?.decimals),
            tokenAddress,
            ownerAddress,
        };

        try {
            const responseApprove = await this.service.getApproveTx(params);

            return responseApprove.data[0];
        } catch (error) {
            console.error('ApproveOperation performTx error', error);
            return null;
        }
    }

    onSuccess = async (store: Storage): Promise<void> => {
        console.log('Approve success', 'Update allowance');
        this.allowance = {};

        this.checkAllowance(store);
    };

    getOperationFlow(): TxOperationFlow[] {
        this.flow = [
            {
                type: TRANSACTION_TYPES.APPROVE,
                make: TRANSACTION_TYPES.APPROVE,
                moduleIndex: this.getModule(),
            },
        ];

        return this.flow;
    }

    checkAllowance = async (store: Storage): Promise<void> => {
        try {
            const amount = this.getParamByField('amount');

            const allowance = await this.getAllowance();

            this.isNeedApprove = +allowance < +amount;

            const { typeLp } = this.params as any;

            if (typeLp === TRANSACTION_TYPES.REMOVE_LIQUIDITY)
                return store.dispatch('moduleStates/setIsNeedRemoveLPApprove', this.isNeedApprove);

            store.dispatch('moduleStates/setIsNeedApproveLP', this.isNeedApprove);
        } catch (error) {
            console.error('ApproveOperation onSuccess error', error);
        }
    };

    async getAllowance(): Promise<void | number> {
        console.log('ApproveOperation getAllowance, update allowance');

        const { net, ownerAddress } = this.params as any;
        let from = this.params.from;

        if (!from) {
            const tokens = this.getTokens();
            from = tokens.from;
        }

        const { address } = from || {};
        const tokenIn = address || '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

        if (tokenIn === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') return Number.MAX_SAFE_INTEGER;
        if (this.allowance[tokenIn]) return this.allowance[tokenIn];

        const params: IGetAllowanceRequest = {
            net,
            tokenAddress: tokenIn,
            ownerAddress,
        };

        try {
            const allowance = await this.service.getAllowance(params);

            this.allowance[tokenIn] = allowance.data;

            return allowance.data;
        } catch (error) {
            console.error('ApproveOperation getAllowance error', error);
        }
    }
}
