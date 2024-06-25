import { BaseOpParams } from '@/core/operations/models/Operations';
import { BaseOperation } from '@/core/operations/BaseOperation';
import { AllQuoteParams } from '@/modules/bridge-dex/models/Request.type';
import { IBridgeDexTransaction } from '@/modules/bridge-dex/models/Response.interface';
import { TxOperationFlow } from '@/shared/models/types/Operations';

import { TRANSACTION_TYPES } from '@/core/operations/models/enums/tx-types.enum';

import { IGetAllowanceRequest } from '@/modules/portal-fi/models/request';
import PortalFiApi, { IPortalFiApi } from '@/modules/portal-fi/api';

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

        const params: IGetAllowanceRequest = {
            net,
            amount,
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

    checkAllowance = async (): Promise<void> => {
        try {
            const amount = this.getParamByField('amount');

            const allowance = await this.getAllowance();

            this.isNeedApprove = +allowance < +amount;
        } catch (error) {
            console.error('ApproveOperation onSuccess error', error);
        }
    };

    async getAllowance(): Promise<void | number> {
        console.log('ApproveOperation getAllowance, update allowance');

        const { net, ownerAddresses = {}, from } = this.params as any;

        const { address } = from || {};
        const tokenIn = address || '0x0000000000000000000000000000000000000000';

        if (this.allowance[tokenIn]) return this.allowance[tokenIn];

        const params: IGetAllowanceRequest = {
            net,
            tokenAddress: tokenIn,
            ownerAddress: ownerAddresses[net],
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
