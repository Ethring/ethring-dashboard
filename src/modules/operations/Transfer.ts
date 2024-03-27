import { TxOperationFlow } from '@/shared/models/types/Operations';
import { IBaseOperation, BaseOpParams, PerformOptionalParams, PerformTxParams } from '@/modules/operations/models/Operations';
import { BaseOperation } from '@/modules/operations/BaseOperation';

import { TRANSACTION_TYPES, STATUSES } from '../../shared/models/enums/statuses.enum';
import { ModuleType } from '@/shared/models/enums/modules.enum';
import { ICreateTransaction } from '@/Transactions/types/Transaction';
import { getActionByTxType } from './shared/utils';
import { IBridgeDexTransaction } from '../bridge-dex/models/Response.interface';
import { Ecosystems } from '../bridge-dex/enums/Ecosystem.enum';
import { IAsset } from '../../shared/models/fields/module-fields';

export default class TransferOperation extends BaseOperation {
    module: ModuleType.send;

    params: BaseOpParams;

    flow: TxOperationFlow[];

    transactionType: TRANSACTION_TYPES.TRANSFER;

    constructor() {
        super();
        this.setTxType(TRANSACTION_TYPES.TRANSFER);
    }

    perform(index: number, account: string, ecosystem: string, chainId: string, { make }: PerformOptionalParams): ICreateTransaction {
        const isStake = this.getModule() === ModuleType.stake;

        isStake ? this.setTxType(TRANSACTION_TYPES.STAKE) : this.setTxType(TRANSACTION_TYPES.TRANSFER);

        const notificationTitle = `${make} ${this.getTitle()}`;

        return {
            index,
            module: this.getModule(),
            account,

            status: index === 0 ? STATUSES.IN_PROGRESS : STATUSES.PENDING,

            ecosystem,

            chainId,

            metaData: {
                action: this.getAction(),
                type: this.getTxType(),
                notificationTitle,
                params: this.params,
                metaData: {
                    ...this.params,
                    tokens: this.getTokens(),
                },
            },
        } as ICreateTransaction;
    }

    async performTx(ecosystem: Ecosystems): Promise<IBridgeDexTransaction> {
        const params = {
            fromAddress: this.params.ownerAddresses[this.params.net],
            toAddress: this.params.receiverAddress,
            amount: this.params.amount,
            token: this.getToken('from'),
            memo: this.params.memo,
        };

        return {
            ecosystem,
            transaction: params,
        };
    }

    getOperationFlow(): TxOperationFlow[] {
        const isStake = this.getModule() === ModuleType.stake;

        isStake ? this.setTxType(TRANSACTION_TYPES.STAKE) : this.setTxType(TRANSACTION_TYPES.TRANSFER);

        this.flow = [
            {
                type: this.getTxType(),
                make: this.getTxType(),
                moduleIndex: this.getModule(),
            },
        ];

        return this.flow;
    }

    async estimateOutput(): Promise<void> {
        if (!this.params.amount) {
            console.warn('Amount is required');
            return;
        }

        this.setParamByField('outputAmount', this.getParamByField('amount'));
    }
}
