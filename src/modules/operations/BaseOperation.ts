import { ModuleType, ModuleTypes } from '@/shared/models/enums/modules.enum';
import { TxOperationFlow } from '../../shared/models/types/Operations';
import { ICreateTransaction } from '@/Transactions/types/Transaction';
import { IBridgeDexTransaction, IQuoteRoute } from '../bridge-dex/models/Response.interface';
import { Ecosystems } from '../bridge-dex/enums/Ecosystem.enum';
import { IAsset } from '../../shared/models/fields/module-fields';
import { AllQuoteParams } from '../bridge-dex/models/Request.type';
import { IBaseOperation, BaseOpParams, PerformOptionalParams, PerformTxParams } from '@/modules/operations/models/Operations';
import { TRANSACTION_TYPES } from '@/shared/models/enums/statuses.enum';
import { getActionByTxType } from './shared/utils';
import { ServiceType } from '../bridge-dex/enums/ServiceType.enum';
import { formatNumber } from '@/shared/utils/numbers';
import { cutAddress } from '@/shared/utils/address';

const DEFAULT_TX_TYPE_BY_MODULE = {
    [ModuleType.stake]: TRANSACTION_TYPES.STAKE,
    [ModuleType.swap]: TRANSACTION_TYPES.DEX,
    [ModuleType.send]: TRANSACTION_TYPES.TRANSFER,
    [ModuleType.bridge]: TRANSACTION_TYPES.BRIDGE,
    [ModuleType.superSwap]: TRANSACTION_TYPES.BRIDGE
};

export class BaseOperation implements IBaseOperation {
    uniqueId: string;

    name: string;

    service: any;

    ecosystem: Ecosystems;

    module: ModuleTypes;

    params: BaseOpParams;

    chainId: string;

    account: string;

    tokens: {
        from?: IAsset;
        to?: IAsset;
    };

    quoteRoute?: IQuoteRoute;

    txResponse: any;

    transactionType: TRANSACTION_TYPES;
    static transactionType: keyof typeof TRANSACTION_TYPES;

    constructor() {
        this.service = null;
        this.setTxType(DEFAULT_TX_TYPE_BY_MODULE[this.module]);
    }

    onSuccess?: (store: any) => Promise<void>;

    setAction?: (action: string) => void;

    static getServiceType?: () => 'bridgedex' | 'superswap' | 'dex';

    getName(): string {
        return this.name;
    }

    setName(name: string): void {
        this.name = name;
    }

    setUniqueId(uniqueId: string): void {
        this.uniqueId = uniqueId;
    }

    getUniqueId(): string {
        return this.uniqueId;
    }

    execute?: () => Promise<string>;

    setParams(params: BaseOpParams): void {
        this.params = params;
    }

    setParamByField(field: string, value: any): void {
        this.params[field] = value;
    }

    getParams(): BaseOpParams {
        return this.params;
    }

    getParamByField(field: string): any {
        return this.params[field];
    }

    setEcosystem(ecosystem: Ecosystems): void {
        this.ecosystem = ecosystem;
    }

    getEcosystem(): Ecosystems {
        return this.ecosystem;
    }

    setChainId(chainId: string): void {
        this.chainId = `${chainId}`;
    }

    getChainId(): string {
        return `${this.chainId}`;
    }

    setAccount(account: string): void {
        this.account = account;
    }

    getAccount(): string {
        return this.account;
    }

    setModule(module: ModuleTypes): void {
        this.module = module;
    }

    getModule(): ModuleTypes {
        return this.module;
    }

    setTokens(tokens: { from: IAsset; to: IAsset }): void {
        this.tokens = tokens;
    }

    setToken(target: 'from' | 'to', token: IAsset): void {
        !this.tokens && (this.tokens = {});
        this.tokens[target] = token;
    }

    getTokens(): { from?: IAsset; to?: IAsset } {
        return this.tokens;
    }

    getToken(target: 'from' | 'to'): IAsset {
        if (!this.tokens) return null;
        if (!this.tokens[target]) return null;

        return this.tokens[target];
    }

    setTxType(type: TRANSACTION_TYPES): void {
        this.transactionType = type;
    }

    static getTxType(): keyof typeof TRANSACTION_TYPES {
        return this.transactionType;
    }

    setQuoteRoute(route: IQuoteRoute): void {
        this.quoteRoute = route;
    }

    getQuoteRoute(): IQuoteRoute {
        return this.quoteRoute;
    }

    getTitle(): string {
        const module = this.getModule() as ModuleType;
        const { count = 0, outputAmount = 0, amount } = this.getParams();
        const { from, to } = this.getTokens() || {};

        let fromTokenTitle = Number(amount) > 0 && from?.symbol ? `${amount} ${from.symbol}` : '';
        let toTokenTitle = Number(outputAmount) > 0 && to?.symbol ? ` to ${outputAmount} ${to.symbol}` : '';

        switch (module) {
            case ModuleType.stake:
                return `STAKE ${fromTokenTitle}`;
            case ModuleType.swap:
                return `SWAP ${fromTokenTitle} ${toTokenTitle}`;
            case ModuleType.send:
                return `SEND ${fromTokenTitle}`;
            case ModuleType.bridge:
                return `BRIDGE ${fromTokenTitle} ${toTokenTitle}`;
            case ModuleType.superSwap:
                const isSameNetwork = this.getParamByField('fromNet') === this.getParamByField('toNet');
                const TYPE = isSameNetwork ? TRANSACTION_TYPES.SWAP : TRANSACTION_TYPES.BRIDGE;
                return `${TYPE} ${fromTokenTitle} ${toTokenTitle}`;
            case ModuleType.nft:
                return `MINT ${count} NFTs`;
            default:
                return `${this.getModule()} - ${BaseOperation.getTxType()}`;
        }
    }

    getNotificationInfo(make: string): {
        title: string;
        description?: string;
    } {
        const module = this.getModule() as ModuleType;
        const { count = 0, outputAmount = 0, amount, receiverAddress = '' } = this.getParams();
        const { from, to } = this.getTokens() || {};

        let fromTokenTitle = Number(amount) > 0 && from?.symbol ? `${formatNumber(amount)} ${from.symbol}` : '';
        let toTokenTitle = Number(outputAmount) > 0 && to?.symbol ? `For ${formatNumber(outputAmount)} ${to.symbol}` : '';

        if (this.transactionType === TRANSACTION_TYPES.APPROVE) toTokenTitle = '';


        switch (module) {
            case ModuleType.stake:
                return {
                    title: `STAKE ${fromTokenTitle}`,
                };
            case ModuleType.swap:
                return {
                    title: `${make} ${fromTokenTitle}`,
                    description: toTokenTitle,
                };
            case ModuleType.send:
                return {
                    title: `SEND ${fromTokenTitle} to ${cutAddress(receiverAddress, 6, 4)}`,
                };
            case ModuleType.bridge:
                return {
                    title: `${make} ${fromTokenTitle}`,
                    description: toTokenTitle,
                };
            case ModuleType.superSwap:
                return {
                    title: `${make} ${fromTokenTitle}`,
                    description: toTokenTitle,
                };
            case ModuleType.nft:
                return {
                    title: `MINT ${count} NFTs`,
                };
            default:
                return {
                    title: `${this.getModule()} - ${BaseOperation.getTxType()}`,
                };
        }
    }

    getAdditionalTooltip() {
        const { from, to } = this.getTokens() || {};
        const { amount, outputAmount } = this.getParams() || {};

        const type = BaseOperation.getTxType();

        if ((!amount && !outputAmount && from) || to) {
            return `${type} ${from.symbol}`;
        }

        // if (from && to && amount && outputAmount) {
        //     return `${type} ${amount} ${from.symbol} to ${outputAmount} ${to.symbol}`;
        // }

        // if (from && !to && amount) {
        //     return `${type} ${amount} ${from.symbol}`;
        // }

        return '';
    }

    getTxResponse() {
        return this.txResponse;
    }

    setTxResponse(response: any) {
        this.txResponse = response;
    }

    static perform(index: number, account: string, ecosystem: string, chainId: string, options: PerformOptionalParams): ICreateTransaction {
        throw new Error('Not implemented');
    }

    static getOperationFlow(): TxOperationFlow[] {
        return [];
    }

    static async estimateOutput(): Promise<void> {
        return Promise.reject('Not implemented');
    }

    static async performTx(ecosystem: Ecosystems, { serviceId }: PerformTxParams): Promise<IBridgeDexTransaction> {
        return Promise.reject('Not implemented');
    }

    static async onSuccess(store: any): Promise<void> {
        console.log('onSuccess', this.transactionType, 'operation');
        return Promise.resolve();
    }
}
