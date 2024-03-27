import { TxOperationFlow } from '@/shared/models/types/Operations';

import { IBaseOperation, BaseOpParams, PerformOptionalParams, PerformTxParams } from '@/modules/operations/models/Operations';
import { BaseOperation } from '@/modules/operations/BaseOperation';

import { AllQuoteParams } from '../bridge-dex/models/Request.type';
import BridgeDexService from '../bridge-dex';
import { ServiceType } from '../bridge-dex/enums/ServiceType.enum';
import { ModuleType } from '@/shared/models/enums/modules.enum';
import _ from 'lodash';
import { IAsset } from '@/shared/models/fields/module-fields';
import { ICreateTransaction } from '@/Transactions/types/Transaction';
import { IBridgeDexTransaction, IQuoteRoute, IQuoteRoutes } from '../bridge-dex/models/Response.interface';
import { getActionByTxType } from './shared/utils';
import { STATUSES, TRANSACTION_TYPES } from '@/shared/models/enums/statuses.enum';
import { ECOSYSTEMS } from '@/Adapter/config';

// [TRANSACTION_TYPES.APPROVE]: async (): Promise<IBridgeDexTransaction> => {
//     const ownerAddress = srcAddressByChain.value[selectedSrcNetwork.value.net] || walletAddress.value;

//     const params: Approve = {
//         net: selectedSrcNetwork.value.net,
//         tokenAddress: selectedSrcToken.value.address,
//         ownerAddress,
//         amount: srcAmount.value,
//     };

//     const responseApprove: IBridgeDexTransaction[] = await makeApproveRequest(selectedRoute.value.serviceId, params);

//     const [tx] = responseApprove;

//     return tx;
// },

export default class DexOperation extends BaseOperation {
    module: ModuleType.swap;

    transactionType: TRANSACTION_TYPES.DEX;

    service: BridgeDexService<ServiceType.dex | ServiceType.bridgedex>;

    flow: TxOperationFlow[];

    constructor() {
        super();
        this.service = new BridgeDexService(ServiceType.dex);
        this.transactionType = TRANSACTION_TYPES.DEX;
    }

    getOperationFlow(): TxOperationFlow[] {
        if (this.getModule() === ModuleType.swap) {
            this.flow = [
                {
                    make: TRANSACTION_TYPES.SWAP,
                    type: TRANSACTION_TYPES.DEX,
                    moduleIndex: this.getModule(),
                },
            ];

            return this.flow;
        }

        const isSameNetwork = this.params.fromNet === this.params.toNet;

        this.flow = [
            {
                make: isSameNetwork ? TRANSACTION_TYPES.SWAP : TRANSACTION_TYPES.BRIDGE,
                type: isSameNetwork ? TRANSACTION_TYPES.DEX : TRANSACTION_TYPES.BRIDGE,
                moduleIndex: this.getModule(),
            },
        ];

        return this.flow;
    }

    async estimateOutput(): Promise<void> {
        if (this.params.fromNet === this.params.toNet) {
            this.service = new BridgeDexService(ServiceType.dex);
        } else {
            this.service = new BridgeDexService(ServiceType.bridgedex);
        }
        if (_.isNaN(Number(this.params.amount)) && Number(this.params.amount) <= 0) {
            console.warn('Amount is required');
            return;
        }

        const serviceId = this.getParamByField('serviceId');

        const { best = null, routes } = (await this.service.callMethod('getQuote', this.params)) as IQuoteRoutes;

        let bestRouteServiceId = null;

        if (!serviceId) {
            bestRouteServiceId = best;
        }

        const bestRoute = routes.find((route) => route.serviceId === bestRouteServiceId) || routes[0];

        this.setParamByField('outputAmount', bestRoute?.toAmount || null);
    }

    async performTx(ecosystem: string, { serviceId }: PerformTxParams): Promise<IBridgeDexTransaction> {
        if (this.getParamByField('fromNet') === this.getParamByField('toNet') && ecosystem !== ECOSYSTEMS.COSMOS) {
            this.service = new BridgeDexService(ServiceType.dex);
        } else {
            this.service = new BridgeDexService(ServiceType.bridgedex);
        }

        this.service.setServiceId(serviceId);

        const response = await this.service.callMethod('getSwapTx', this.params);

        if (Array.isArray(response)) {
            return response[0];
        }

        return null;
    }

    perform(index: number, account: string, ecosystem: string, chainId: string, { make }: PerformOptionalParams): ICreateTransaction {
        let notificationTitle = `${make} ${this.getTitle()}`;

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
                params: {
                    ...this.params,
                    tokens: this.getTokens(),
                },
            },
        } as ICreateTransaction;
    }
}
