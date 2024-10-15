import { isNaN } from 'lodash';

import { Ecosystem } from '@/shared/models/enums/ecosystems.enum';

import BridgeDexService from '@/modules/bridge-dex';
import { ServiceType } from '@/modules/bridge-dex/enums/ServiceType.enum';
import { IBridgeDexTransaction, IQuoteRoute, IQuoteRoutes } from '@/modules/bridge-dex/models/Response.interface';

import { BaseOperation } from '@/core/operations/BaseOperation';
import { PerformTxParams } from '@/core/operations/models/Operations';

import { ModuleType } from '@/shared/models/enums/modules.enum';
import { TxOperationFlow } from '@/shared/models/types/Operations';
import { TRANSACTION_TYPES } from '@/core/operations/models/enums/tx-types.enum';

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

        const isSameNetwork = this.getParamByField('fromNet') === this.getParamByField('toNet');

        const txType = isSameNetwork ? TRANSACTION_TYPES.DEX : TRANSACTION_TYPES.BRIDGE;
        const makeAction = isSameNetwork ? TRANSACTION_TYPES.SWAP : TRANSACTION_TYPES.DEX;

        this.setTxType(txType);

        this.flow = [
            {
                make: makeAction,
                type: txType,
                moduleIndex: this.getModule(),
            },
        ];

        return this.flow;
    }

    async estimateOutput(): Promise<void> {
        if (this.getParamByField('fromNet') === this.getParamByField('toNet')) this.service = new BridgeDexService(ServiceType.dex);
        else this.service = new BridgeDexService(ServiceType.bridgedex);

        if (!this.getParamByField('amount')) return;

        if (isNaN(Number(this.params.amount)) && Number(this.params.amount) <= 0) {
            console.warn('Amount is required');
            return;
        }

        const serviceId = this.getParamByField('serviceId');
        serviceId && this.service.setServiceId(serviceId);

        if (serviceId === 'debridge' && this.params.fromNet === this.params.toNet) {
            this.setParamByField('outputAmount', null);
            throw Error('No route found');
        }

        if (this.tokens.to?.address) this.params.toToken = this.tokens.to?.address;

        const { best = null, routeId, routes } = (await this.service.callMethod('getQuote', this.params)) as IQuoteRoutes;

        let bestRouteServiceId = null;

        if (!serviceId) bestRouteServiceId = best;

        this.setParamByField('routeId', routeId);

        const bestRoute: IQuoteRoute = routes.find((route) => route.serviceId === bestRouteServiceId) || routes[0];

        if (!bestRoute) {
            console.warn('No route found', 'For params:', this.params);
            return;
        }

        this.setQuoteRoutes(routes);

        this.setParamByField('outputAmount', bestRoute.toAmount);
    }

    async performTx(ecosystem: string, { serviceId }: PerformTxParams): Promise<IBridgeDexTransaction | null> {
        if (this.getParamByField('fromNet') === this.getParamByField('toNet') && ecosystem !== Ecosystem.COSMOS)
            this.service = new BridgeDexService(ServiceType.dex);
        else this.service = new BridgeDexService(ServiceType.bridgedex);

        serviceId && this.service.setServiceId(serviceId);

        if (typeof this.params.toToken !== 'string') this.params.toToken = this.params.toToken?.address;
        if (typeof this.params.fromToken !== 'string') this.params.fromToken = this.params.fromToken?.address;

        const response = await this.service.callMethod('getSwapTx', this.params);

        if (Array.isArray(response)) return response[0];

        return null;
    }
}
