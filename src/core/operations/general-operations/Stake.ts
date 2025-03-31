import { BaseOpParams } from '@/core/operations/models/Operations';
import { TRANSACTION_TYPES } from '@/core/operations/models/enums/tx-types.enum';

import { AllQuoteParams } from '@/modules/bridge-dex/models/Request.type';
import { BaseOperation } from '@/core/operations/BaseOperation';
import { Ecosystems } from '@/modules/bridge-dex/enums/Ecosystem.enum';
import { IBridgeDexTransaction } from '@/modules/bridge-dex/models/Response.interface';
import { ModuleType } from '@/shared/models/enums/modules.enum';
import { TxOperationFlow } from '@/shared/models/types/Operations';
import AdapterFacade from '@/core/wallet-adapter/ecosystems';
import BigNumber from 'bignumber.js';

export default class TransferOperation extends BaseOperation {
    module: keyof typeof ModuleType = ModuleType.send;

    params: BaseOpParams = {} as AllQuoteParams;

    flow: TxOperationFlow[] = [];

    constructor() {
        super();
        super.setTxType(TRANSACTION_TYPES.STAKE);
    }

    async performTx(ecosystem: Ecosystems): Promise<IBridgeDexTransaction> {
        const { fromNet, net, ownerAddresses = {} } = this.params as any;

        const network = net || fromNet;

        const params = {
            fromAddress: ownerAddresses[network],
            toAddress: this.params.receiverAddress,
            amount: this.params.outputAmount || this.params.amount,
            token: this.getToken('from'),
            memo: this.params.memo,
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

        const adapter = AdapterFacade(this.getEcosystem());

        if (!adapter) return;

        // Try to get estimated fee
        try {
            const perform = await this.performTx(this.getEcosystem());

            const tx = await adapter.prepareDelegateTransaction(perform.transaction);

            const signClient = await adapter.getSignClientByChain(this.getChainId());

            const { msg, fee } = tx;

            const estimatedFee = await adapter.getTransactionFee(signClient.client, msg, { rpc: signClient.rpc });

            if (estimatedFee) fee.gas = estimatedFee.gas;

            if (estimatedFee?.amount) fee.amount = estimatedFee.amount;

            // Set estimated fee

            const outputAmount = BigNumber(this.getParamByField('amount')).minus(estimatedFee.gasToCoin).toFixed(6);
            this.setParamByField('outputAmount', outputAmount);
            this.setParamByField('amount', outputAmount);
        } catch (error) {
            console.error('[COSMOS -> signSend -> estimate]', error);
            this.setParamByField('outputAmount', this.getParamByField('amount'));
        }
    }
}
