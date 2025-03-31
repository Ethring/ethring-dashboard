import BigNumber from 'bignumber.js';
import { utils } from 'ethers';

import { BaseOpParams } from '@/core/operations/models/Operations';
import { TRANSACTION_TYPES } from '@/core/operations/models/enums/tx-types.enum';

import { AllQuoteParams } from '@/modules/bridge-dex/models/Request.type';
import { BaseOperation } from '@/core/operations/BaseOperation';
import { Ecosystems } from '@/modules/bridge-dex/enums/Ecosystem.enum';
import { IBridgeDexTransaction } from '@/modules/bridge-dex/models/Response.interface';
import { ModuleType } from '@/shared/models/enums/modules.enum';
import { TxOperationFlow } from '@/shared/models/types/Operations';
import EthereumAdapter from '@/core/wallet-adapter/ecosystems/ethereum';

export default class CallContractMethod extends BaseOperation {
    module: keyof typeof ModuleType = ModuleType.pendleSilo;

    params: BaseOpParams = {} as AllQuoteParams;

    flow: TxOperationFlow[] = [];

    constructor() {
        super();
        super.setTxType(TRANSACTION_TYPES.CALL_CONTRACT_METHOD);
    }

    async performTx(ecosystem: Ecosystems): Promise<IBridgeDexTransaction> {
        const { argKeys, ownerAddresses, fromNet, net, receiverAddress } = this.params as any;
        const network = net || fromNet;
        const { from } = this.getTokens();
        const { address, decimals } = from || {};

        const argsToCall = [];

        const amount = this.getParamByField('amount');
        const amountIn = Math.floor(+BigNumber(amount).multipliedBy(`1e${decimals}`).toFixed());
        const adapter = EthereumAdapter;

        for (const key of argKeys)
            switch (key) {
                case 'amount':
                    if (!address) {
                        argsToCall.push(amountIn.toString());
                        break;
                    }

                    const paramsBalanceOf = {
                        method: 'balanceOf',
                        contractAddress: address,
                        args: [ownerAddresses[net]],
                        type: 'READ',
                    };

                    const balanceHex = await adapter.callContractMethod(paramsBalanceOf);

                    const balance = BigNumber(balanceHex._hex).toNumber();

                    argsToCall.push(balance < amountIn ? balance.toString() : amountIn.toString());
                    break;

                case 'owner':
                case 'caller':
                case 'receiver':
                case 'onBehalfOf':
                    argsToCall.push(ownerAddresses[network]);
                    break;

                case 'referralCode':
                    argsToCall.push(1234);
                    break;

                case 'tokenAddress':
                    argsToCall.push(address);
                    break;

                case 'validator':
                    argsToCall.push(receiverAddress);
                    break;

                case 'reserveId':
                    argsToCall.push(49);
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
                value: !address ? amountIn : null,
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
        if (this.params.isEqualOutput) this.setParamByField('outputAmount', this.params.amount);
    }
}
