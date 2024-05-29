import { BaseOpParams } from '@/core/operations/models/Operations';
import { TRANSACTION_TYPES } from '@/core/operations/models/enums/tx-types.enum';

import { AllQuoteParams } from '@/modules/bridge-dex/models/Request.type';
import { BaseOperation } from '@/core/operations/BaseOperation';
import { Ecosystems } from '@/modules/bridge-dex/enums/Ecosystem.enum';
import { IBridgeDexTransaction } from '@/modules/bridge-dex/models/Response.interface';
import { ModuleType } from '@/shared/models/enums/modules.enum';
import { TxOperationFlow } from '@/shared/models/types/Operations';

import { utils } from 'ethers';

export default class CallContractMethod extends BaseOperation {
    module: keyof typeof ModuleType = ModuleType.pendleSilo;

    params: BaseOpParams = {} as AllQuoteParams;

    flow: TxOperationFlow[] = [];

    constructor() {
        super();
        super.setTxType(TRANSACTION_TYPES.CALL_CONTRACT_METHOD);
    }

    async performTx(ecosystem: Ecosystems): Promise<IBridgeDexTransaction> {
        const { argKeys, args, ownerAddresses, fromNet, net } = this.params as any;
        const network = net || fromNet;

        const argsToCall = [];

        for (const key of argKeys)
            switch (key) {
                case 'amount':
                    argsToCall.push(utils.parseUnits(this.getParamByField(key), 18).toBigInt());
                    break;

                case 'owner':
                    argsToCall.push(ownerAddresses[network]);
                    break;

                default:
                    argsToCall.push(this.getParamByField(key));
                    break;
            }

        return {
            ecosystem,
            transaction: {
                contractAddress: this.getParamByField('contractAddress'),
                method: this.getParamByField('method'),
                args: argsToCall || this.getParamByField('args'),
                abi: this.getParamByField('abi'),
            },
        };
    }

    getOperationFlow(): TxOperationFlow[] {
        this.flow = [
            {
                type: this.transactionType,
                make: this.make || this.transactionType,
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
    }
}
