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
        const { net, ownerAddress, tokenAddress, amount } = this.params as any;
        const { from } = this.getTokens();

        const params: IGetAllowanceRequest = {
            net,
            amount: formatNumber(amount, from?.decimals, false),
            tokenAddress,
            ownerAddress,
        };

        try {
            const responseApprove = await this.service.getApproveTx(params);

            if (!responseApprove.data?.length) return null;

            return responseApprove.data[0];
        } catch (error) {
            console.error('ApproveOperation performTx error', error);
            return null;
        }
    }

    onSuccess = async (store: Storage): Promise<void> => {
        console.log('Approve success', 'Update allowance');

        this.checkAllowance(store, true);
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

    checkAllowance = async (store: Storage, isUpdate = false): Promise<void> => {
        try {
            const amount = store.getters['tokenOps/srcAmount'];

            const allowance = await this.getAllowance(store, isUpdate);

            this.isNeedApprove = +allowance < +amount;

            const { typeLp } = this.params as any;

            if (typeLp === TRANSACTION_TYPES.REMOVE_LIQUIDITY)
                return store.dispatch('portalFi/setIsNeedRemoveLPApprove', this.isNeedApprove);

            store.dispatch('portalFi/setIsNeedApproveLP', this.isNeedApprove);
        } catch (error) {
            console.error('ApproveOperation onSuccess error', error);
        }
    };

    async getAllowance(store: Storage, isUpdate = false): Promise<void | number> {
        console.log('ApproveOperation getAllowance, update allowance');

        const { net, ownerAddress } = this.params as any;
        let from = this.params.from;

        if (!from) {
            const tokens = this.getTokens();
            from = tokens.from;
        }

        const { address } = from || {};

        if (!address) return Number.MAX_SAFE_INTEGER;

        const allowance = store.getters['portalFi/getAllowance'](ownerAddress, address);

        if (allowance && !isUpdate) return allowance;

        const params: IGetAllowanceRequest = {
            net,
            tokenAddress: address,
            ownerAddress,
        };

        try {
            const allowance = await this.service.getAllowance(params);

            store.dispatch('portalFi/setAllowance', {
                owner: ownerAddress,
                token: address,
                value: allowance.data,
            });

            return allowance?.data || 0;
        } catch (error) {
            console.error('ApproveOperation getAllowance error', error);
        }
    }
}
