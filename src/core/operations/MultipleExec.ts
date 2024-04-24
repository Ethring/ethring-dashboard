import { TxOperationFlow } from '@/shared/models/types/Operations';
import { BaseOpParams, PerformOptionalParams } from '@/core/operations/models/Operations';
import { BaseOperation } from '@/core/operations/BaseOperation';

import { TRANSACTION_TYPES, STATUSES } from '@/shared/models/enums/statuses.enum';
import { ModuleType } from '@/shared/models/enums/modules.enum';
import { ICreateTransaction } from '@/core/transaction-manager/types/Transaction';
import { getActionByTxType } from './shared/utils';
import { IBridgeDexTransaction } from '@/modules/bridge-dex/models/Response.interface';
import { Ecosystems } from '@/modules/bridge-dex/enums/Ecosystem.enum';

export default class MultipleContractExec extends BaseOperation {
    module: ModuleType.nft = ModuleType.nft;

    params: BaseOpParams = {} as any;

    flow: TxOperationFlow[] = [];

    constructor() {
        super();
        super.setTxType(TRANSACTION_TYPES.EXECUTE_MULTIPLE);
    }

    perform(index: number, account: string, ecosystem: string, chainId: string, { make }: PerformOptionalParams): ICreateTransaction {
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
                notificationDescription: description || '',
                params: this.params,
                tokens: this.getTokens(),
            },
        } as ICreateTransaction;
    }

    async performTx(ecosystem: Ecosystems): Promise<IBridgeDexTransaction> {
        const params = {
            net: this.params.net,
            fromAddress: this.params.ownerAddresses[this.params.net] || '',
            amount: this.params.amount,
            token: this.getToken('from'),
            contract: this.params.minter ? this.params.minter : this.params.contract,
            count: this.params.count,
            funds: this.params.funds ? [this.params.funds] : null,
        };

        return {
            ecosystem,
            transaction: params,
        };
    }

    getOperationFlow(): TxOperationFlow[] {
        this.flow = [
            {
                type: this.transactionType,
                make: 'MINT',
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
