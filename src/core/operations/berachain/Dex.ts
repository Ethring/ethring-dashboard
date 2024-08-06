import BigNumber from 'bignumber.js';

import { BaseOpParams } from '@/core/operations/models/Operations';
import { TRANSACTION_TYPES } from '@/core/operations/models/enums/tx-types.enum';

import { AllQuoteParams } from '@/modules/bridge-dex/models/Request.type';
import { BaseOperation } from '@/core/operations/BaseOperation';
import { Ecosystems } from '@/modules/bridge-dex/enums/Ecosystem.enum';
import { IBridgeDexTransaction } from '@/modules/bridge-dex/models/Response.interface';
import { ModuleType } from '@/shared/models/enums/modules.enum';
import { TxOperationFlow } from '@/shared/models/types/Operations';

import BerachainApi from '@/modules/berachain/api/index';
import { IGetRouteRequest } from '@/modules/berachain/models/request';
import EthereumAdapter from '@/core/wallet-adapter/ecosystems/ethereum';

const DEX_CONTRACT = '0x21e2C0AFd058A89FCf7caf3aEA3cB84Ae977B73D';

export default class BerachainDEX extends BaseOperation {
    module: keyof typeof ModuleType = ModuleType.pendleSilo;

    params: BaseOpParams = {} as AllQuoteParams;

    flow: TxOperationFlow[] = [];

    constructor() {
        super();
        super.setTxType(TRANSACTION_TYPES.CALL_CONTRACT_METHOD);
        this.service = new BerachainApi();
    }

    async performTx(ecosystem: Ecosystems): Promise<IBridgeDexTransaction> {
        const { from } = this.getTokens();
        const { address, decimals } = from || {};

        const amount = this.getParamByField('amount');
        const amountIn = Math.floor(+BigNumber(amount).multipliedBy(`1e${decimals}`).toFixed());

        return {
            ecosystem,
            transaction: {
                contractAddress: DEX_CONTRACT,
                method: 'multiSwap',
                args: this.getParamByField('args'),
                abi: 'BERACHAIN',
                value: !address ? amountIn.toString() : null,
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
        try {
            const { toToken } = this.params as any;

            const { from } = this.getTokens();

            const { decimals } = from || {};

            const adapter = EthereumAdapter;
            if (!adapter) return;

            const amountBN = BigInt(BigNumber(this.getParamByField('amount')).multipliedBy(`1e${decimals}`).toString());

            const swapParams = {
                fromAsset: '0x7507c1dc16935B82698e4C63f2746A2fCf994dF8',
                toAsset: toToken,
                amount: amountBN,
            } as IGetRouteRequest;

            const response = await this.service.getRoute(swapParams);

            const { steps } = response;
            if (!steps?.length) return;

            const { poolIdx, base, quote, isBuy } = steps[0];

            const paramsPreviewSwap = {
                method: 'previewMultiSwap',
                contractAddress: DEX_CONTRACT,
                args: [[{ poolIdx, base, quote, isBuy }], amountBN],
                abi: 'BERACHAIN',
                type: 'READ',
            };

            const res = await adapter.callContractMethod(paramsPreviewSwap);

            const outputAmount = BigNumber(res?.out?._hex || 0)
                .dividedBy(`1e${decimals}`)
                .toFixed(8);

            this.setParamByField('outputAmount', outputAmount);

            // set args for multiswap method
            this.setParamByField('args', [
                [{ poolIdx, base, quote: '0x0000000000000000000000000000000000000000', isBuy }],
                amountBN.toString(),
                Math.floor(+BigNumber(res?.predictedQty?._hex).multipliedBy(0.95).toFixed()).toString(),
            ]);
        } catch (error) {
            throw error;
        }
    }
}
