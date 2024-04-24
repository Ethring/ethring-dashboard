import _ from 'lodash';

import { ECOSYSTEMS } from '@/core/wallet-adapter/config';
import { ICreateTransaction } from '@/core/transaction-manager/types/Transaction';

import BridgeDexService from '@/modules/bridge-dex';
import { ServiceType } from '@/modules/bridge-dex/enums/ServiceType.enum';
import { IBridgeDexTransaction, IQuoteRoute, IQuoteRoutes } from '@/modules/bridge-dex/models/Response.interface';

import { BaseOperation } from '@/core/operations/BaseOperation';
import { PerformOptionalParams, PerformTxParams } from '@/core/operations/models/Operations';

import { ModuleType } from '@/shared/models/enums/modules.enum';
import { TxOperationFlow } from '@/shared/models/types/Operations';
import { STATUSES, TRANSACTION_TYPES } from '@/shared/models/enums/statuses.enum';

import { getActionByTxType } from '@/core/operations/shared/utils';

export default class DexOperation extends BaseOperation {
    module: ModuleType.swap = ModuleType.swap;

    service: BridgeDexService<ServiceType.dex | ServiceType.bridgedex>;

    flow: TxOperationFlow[] = [];

    getServiceType(): ServiceType {
        if (this.getModule() === ModuleType.superSwap) return ServiceType.superswap;

        return this.getParamByField('fromNet') === this.getParamByField('toNet') ? ServiceType.dex : ServiceType.bridgedex;
    }

    constructor() {
        super();
        this.service = new BridgeDexService(ServiceType.dex);
        super.setTxType(TRANSACTION_TYPES.DEX);
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
        if (this.getParamByField('fromNet') === this.getParamByField('toNet')) this.service = new BridgeDexService(ServiceType.dex);
        else this.service = new BridgeDexService(ServiceType.bridgedex);

        if (_.isNaN(Number(this.params.amount)) && Number(this.params.amount) <= 0) {
            console.warn('Amount is required');
            return;
        }

        const serviceId = this.getParamByField('serviceId');

        const { best = null, routes } = (await this.service.callMethod('getQuote', this.params)) as IQuoteRoutes;

        let bestRouteServiceId = null;

        if (!serviceId) {
            bestRouteServiceId = best;
            this.setParamByField('serviceId', bestRouteServiceId);
        }

        const bestRoute: IQuoteRoute = routes.find((route) => route.serviceId === bestRouteServiceId) || routes[0];

        if (!bestRoute) {
            console.warn('No route found', 'For params:', this.params);
            return;
        }

        this.setQuoteRoute(bestRoute);

        this.setParamByField('outputAmount', bestRoute.toAmount);
    }

    async performTx(ecosystem: string, { serviceId }: PerformTxParams): Promise<IBridgeDexTransaction | null> {
        if (this.getParamByField('fromNet') === this.getParamByField('toNet') && ecosystem !== ECOSYSTEMS.COSMOS)
            this.service = new BridgeDexService(ServiceType.dex);
        else this.service = new BridgeDexService(ServiceType.bridgedex);

        serviceId && this.service.setServiceId(serviceId);

        const response = await this.service.callMethod('getSwapTx', this.params);

        if (Array.isArray(response)) return response[0];

        return null;
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
                notificationDescription: description,
                params: {
                    ...this.params,
                    tokens: this.getTokens(),
                    slippageTolerance: this.getParamByField('slippageTolerance'),
                },
            },
        } as ICreateTransaction;
    }
}
