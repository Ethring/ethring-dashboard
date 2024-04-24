import { BaseOpParams, PerformOptionalParams } from '@/core/operations/models/Operations';
import { STATUSES, TRANSACTION_TYPES } from '@/shared/models/enums/statuses.enum';

import { AllQuoteParams } from '@/modules/bridge-dex/models/Request.type';
import { BaseOperation } from '@/core/operations/BaseOperation';
import { Ecosystems } from '@/modules/bridge-dex/enums/Ecosystem.enum';
import { IBridgeDexTransaction } from '@/modules/bridge-dex/models/Response.interface';
import { ICreateTransaction } from '@/core/transaction-manager/types/Transaction';
import { ModuleType } from '@/shared/models/enums/modules.enum';
import { TxOperationFlow } from '@/shared/models/types/Operations';
import { getActionByTxType } from './shared/utils';

export default class TransferOperation extends BaseOperation {
    module: keyof typeof ModuleType = ModuleType.send;

    params: BaseOpParams = {} as AllQuoteParams;

    flow: TxOperationFlow[] = [];

    constructor() {
        super();
        super.setTxType(TRANSACTION_TYPES.TRANSFER);

        const isStake = this.getModule() === ModuleType.stake;

        isStake ? this.setTxType(TRANSACTION_TYPES.STAKE) : this.setTxType(TRANSACTION_TYPES.TRANSFER);
    }

    perform(index: number, account: string, ecosystem: string, chainId: string, { make }: PerformOptionalParams): ICreateTransaction {
        const isStake = this.getModule() === ModuleType.stake;

        isStake ? this.setTxType(TRANSACTION_TYPES.STAKE) : this.setTxType(TRANSACTION_TYPES.TRANSFER);

        const { title, description } = this.getNotificationInfo(make);

        return {
            index,
            module: this.getModule(),
            account,

            status: index === 0 ? STATUSES.IN_PROGRESS : STATUSES.PENDING,

            ecosystem,

            chainId,

            metaData: {
                action: getActionByTxType(this.transactionType),
                type: this.transactionType,
                notificationTitle: title,
                notificationDescription: description,
                params: this.params,
                tokens: this.getTokens(),
            },
        } as ICreateTransaction;
    }

    async performTx(ecosystem: Ecosystems): Promise<IBridgeDexTransaction> {
        const { fromNet, net, ownerAddresses = {} } = this.params as any;

        const network = net || fromNet;

        const params = {
            fromAddress: ownerAddresses[network],
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
                type: this.transactionType,
                make: this.transactionType,
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
