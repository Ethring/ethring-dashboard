import { ModuleTypes } from '@/shared/models/enums/modules.enum';

import { IBaseOperation, BaseOpParams, PerformOptionalParams, PerformTxParams } from '@/modules/operations/models/Operations';
import { BaseOperation } from '@/modules/operations/BaseOperation';

import { IBridgeDexTransaction } from '../bridge-dex/models/Response.interface';
import { Ecosystems } from '../bridge-dex/enums/Ecosystem.enum';
import { IAsset } from '../../shared/models/fields/module-fields';
import { AllQuoteParams, GetApproveTxParams } from '../bridge-dex/models/Request.type';
import { ICreateTransaction } from '@/Transactions/types/Transaction';
import { TxOperationFlow } from '../../shared/models/types/Operations';
import { STATUSES, TRANSACTION_TYPES } from '@/shared/models/enums/statuses.enum';
import { getActionByTxType } from './shared/utils';
import DexOperation from './Dex';

export class ApproveOperation extends DexOperation {
    flow: TxOperationFlow[];

    constructor() {
        super();

        super.setTxType(TRANSACTION_TYPES.APPROVE);
    }

    perform(index: number, account: string, ecosystem: string, chainId: string, options: PerformOptionalParams): ICreateTransaction {
        const { make } = options;
        let notificationTitle = `${make} ${this.getTitle()}`;

        return {
            index,
            module: this.module,
            account,
            status: index === 0 ? STATUSES.IN_PROGRESS : STATUSES.PENDING,
            ecosystem,
            chainId,
            metaData: {
                action: this.getAction(),
                type: this.getTxType(),
                notificationTitle,
                params: {
                    ...this.params,
                    tokens: this.getTokens(),
                },
            },
        };
    }

    async performTx(ecosystem: Ecosystems, { serviceId }: PerformTxParams): Promise<IBridgeDexTransaction> {
        const params = {
            net: this.params.net,
            tokenAddress: this.params.tokenAddress,
            ownerAddress: this.params.ownerAddress,
            amount: this.params.amount,
        } as GetApproveTxParams;

        try {
            serviceId && this.service.setServiceId(serviceId);

            const responseApprove = await this.service.getApproveTx(params);
            console.log('responseApprove', responseApprove);

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
                type: TRANSACTION_TYPES.APPROVE,
                make: TRANSACTION_TYPES.APPROVE,
                moduleIndex: this.getModule(),
            },
        ];

        return this.flow;
    }
}
