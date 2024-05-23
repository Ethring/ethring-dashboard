import { BaseOpParams } from '@/core/operations/models/Operations';
import { TRANSACTION_TYPES } from '@/core/operations/models/enums/tx-types.enum';

import { AllQuoteParams } from '@/modules/bridge-dex/models/Request.type';
import { BaseOperation } from '@/core/operations/BaseOperation';
import { Ecosystems } from '@/modules/bridge-dex/enums/Ecosystem.enum';
import { IBridgeDexTransaction } from '@/modules/bridge-dex/models/Response.interface';
import { ModuleType } from '@/shared/models/enums/modules.enum';
import { TxOperationFlow } from '@/shared/models/types/Operations';
import PendleApi, { IPendleApi } from '@/modules/pendle-silo/api';
import { ISwapExactTokenForPTRequest } from '@/modules/pendle-silo/models/request';
import BigNumber from 'bignumber.js';
import { utils } from 'ethers';

export default class PendleSwapTokenForPT extends BaseOperation {
    module: keyof typeof ModuleType = ModuleType.pendleSilo;

    params: BaseOpParams = {} as AllQuoteParams;

    flow: TxOperationFlow[] = [];

    service: IPendleApi;

    constructor() {
        super();
        super.setTxType(TRANSACTION_TYPES.SWAP_TOKEN_TO_PT);
        this.service = new PendleApi();
    }

    async performTx(ecosystem: Ecosystems): Promise<IBridgeDexTransaction> {
        const { fromNet, net, ownerAddresses = {} } = this.params as any;

        const network = net || fromNet;

        const { from } = this.getTokens();

        const { decimals, address } = from || {};

        const tokenIn = address || '0x0000000000000000000000000000000000000000';

        const value = !address ? utils.parseEther(this.getParamByField('amount')) : utils.parseUnits('0');
        const amountBN = BigInt(BigNumber(this.getParamByField('amount')).multipliedBy(`1e${decimals}`).toString());

        const swapParams: ISwapExactTokenForPTRequest = {
            chainId: +this.getChainId(),
            receiverAddr: ownerAddresses[network],
            marketAddr: this.getParamByField('marketAddress'),
            tokenInAddr: tokenIn,
            amountTokenIn: amountBN,
            slippage: 0.005,
        };

        try {
            const response = await this.service.swapExactTokenForPT(swapParams);

            const { transaction } = response;

            return {
                ecosystem,
                transaction: {
                    ...transaction,
                    from: ownerAddresses[network],
                    value,
                },
            };
        } catch (error) {
            console.error('DepositOperation.performTx', error);
            throw error;
        }
    }

    async estimateOutput(): Promise<void> {
        if (!this.params.amount) {
            console.warn('Amount is required');
            return;
        }

        try {
            const { fromNet, net, ownerAddresses = {} } = this.params as any;
            const network = net || fromNet;

            const { from } = this.getTokens();

            const { decimals, address } = from || {};
            const tokenIn = address || '0x0000000000000000000000000000000000000000';

            const amountBN = BigInt(BigNumber(this.getParamByField('amount')).multipliedBy(`1e${decimals}`).toString());

            const swapParams: ISwapExactTokenForPTRequest = {
                chainId: +this.getChainId(),
                receiverAddr: ownerAddresses[network],
                marketAddr: this.getParamByField('marketAddress'),
                tokenInAddr: tokenIn,
                amountTokenIn: amountBN,
                slippage: 0.005,
            };

            const transaction = await this.service.swapExactTokenForPT(swapParams);

            const { data } = transaction;

            const outputAmount = BigNumber(data.amountPtOut).dividedBy(`1e${decimals}`).toFixed(8);

            this.setParamByField('outputAmount', outputAmount);
        } catch (error) {
            console.error('DepositOperation.performTx', error);
            throw error;
        }
    }
}
