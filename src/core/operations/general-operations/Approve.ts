import { PerformOptionalParams, PerformTxParams } from '@/core/operations/models/Operations';

import { IBridgeDexTransaction } from '@/modules/bridge-dex/models/Response.interface';
import { Ecosystems } from '@/modules/bridge-dex/enums/Ecosystem.enum';
import { GetApproveTxParams } from '@/modules/bridge-dex/models/Request.type';
import { ICreateTransaction } from '@/core/transaction-manager/types/Transaction';
import { TxOperationFlow } from '@/shared/models/types/Operations';
import { STATUSES } from '@/shared/models/enums/statuses.enum';
import { TRANSACTION_TYPES } from '@/core/operations/models/enums/tx-types.enum';

import DexOperation from './Dex';
import { getActionByTxType } from '../shared/utils';

export default class ApproveOperation extends DexOperation {
    flow: TxOperationFlow[] = [];

    constructor() {
        super();

        super.setTxType(TRANSACTION_TYPES.APPROVE);
    }

    async performTx(ecosystem: Ecosystems, { serviceId }: PerformTxParams): Promise<IBridgeDexTransaction | null> {
        const params = {
            net: this.params.net,
            tokenAddress: this.params.tokenAddress,
            ownerAddress: this.params.ownerAddress,
            amount: this.params.amount,
        } as GetApproveTxParams;

        try {
            serviceId && this.service.setServiceId(serviceId);

            const responseApprove = await this.service.getApproveTx(params);

            const [tx] = responseApprove;

            return tx;
        } catch (error) {
            console.error('ApproveOperation performTx error', error);
            return null;
        }
    }

    getOperationFlow(): TxOperationFlow[] {
        this.flow = [
            {
                type: this.transactionType,
                make: this.transactionType,
                moduleIndex: this.getModule(),
            },
        ];

        return this.flow;
    }

    onSuccess = async (store: any): Promise<void> => {
        console.log('Approve success', 'Update allowance');

        await store.dispatch('bridgeDexAPI/setServiceAllowance', {
            serviceId: this.getParamByField('serviceId'),
            owner: this.getParamByField('ownerAddress'),
            token: this.getParamByField('tokenAddress'),
            value: null,
        });
    };
}
