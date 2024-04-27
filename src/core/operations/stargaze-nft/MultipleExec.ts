import { TxOperationFlow } from '@/shared/models/types/Operations';
import { BaseOpParams, PerformOptionalParams } from '@/core/operations/models/Operations';
import { BaseOperation } from '@/core/operations/BaseOperation';

import { STATUSES } from '@/shared/models/enums/statuses.enum';
import { TRANSACTION_TYPES } from '@/core/operations/models/enums/tx-types.enum';
import { ModuleType } from '@/shared/models/enums/modules.enum';
import { ICreateTransaction } from '@/core/transaction-manager/types/Transaction';
import { getActionByTxType } from '../shared/utils';
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

    async performTx(ecosystem: Ecosystems): Promise<IBridgeDexTransaction> {
        const { fromNet, ownerAddresses = {} } = this.params as any;

        if (!fromNet || !ownerAddresses || (fromNet && ownerAddresses && ownerAddresses[fromNet])) {
            console.warn('fromNet and ownerAddresses are required');
            return {} as IBridgeDexTransaction;
        }

        const params = {
            net: this.params.net,
            fromAddress: ownerAddresses[fromNet],
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
