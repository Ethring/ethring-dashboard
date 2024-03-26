import { ModuleType, ModuleTypes } from '@/shared/models/enums/modules.enum';
import { TxOperationFlow } from '../../shared/models/types/Operations';
import { ICreateTransaction } from '@/Transactions/types/Transaction';
import { IBridgeDexTransaction } from '../bridge-dex/models/Response.interface';
import { Ecosystems } from '../bridge-dex/enums/Ecosystem.enum';
import { IAsset } from '../../shared/models/fields/module-fields';
import { AllQuoteParams } from '../bridge-dex/models/Request.type';
import { IBaseOperation, BaseOpParams, PerformOptionalParams, PerformTxParams } from '@/modules/operations/models/Operations';
import { TRANSACTION_TYPES } from '@/shared/models/enums/statuses.enum';
import { getActionByTxType } from './shared/utils';

const DEFAULT_TX_TYPE_BY_MODULE = {
    [ModuleType.stake]: TRANSACTION_TYPES.STAKE,
    [ModuleType.swap]: TRANSACTION_TYPES.DEX,
    [ModuleType.send]: TRANSACTION_TYPES.TRANSFER,
    [ModuleType.bridge]: TRANSACTION_TYPES.BRIDGE,
    [ModuleType.superSwap]: TRANSACTION_TYPES.BRIDGE,
};

export class BaseOperation implements IBaseOperation {
    name: string;

    service: any;

    ecosystem: Ecosystems;

    module: ModuleTypes;

    transactionType: keyof typeof TRANSACTION_TYPES;

    params: BaseOpParams;

    chainId: string;

    account: string;

    tokens: {
        from?: IAsset;
        to?: IAsset;
    };

    constructor() {
        this.service = null;
        this.setTxType(DEFAULT_TX_TYPE_BY_MODULE[this.module]);
    }

    getName(): string {
        return this.name;
    }

    setName(name: string): void {
        this.name = name;
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

    setTxType(type: keyof typeof TRANSACTION_TYPES): void {
        this.transactionType = type;
    }

    getTxType(): keyof typeof TRANSACTION_TYPES {
        return this.transactionType;
    }

    getAction(): string {
        return getActionByTxType(this.transactionType);
    }

    getTitle(): string {
        if (!this.getToken('from') || !this.params.amount) {
            return this.getName() || `${this.getModule()} - ${this.getTxType()}`;
        }

        const title = `${this.params.amount} ${this.getToken('from')?.symbol || ''}`;

        if (this.getToken('to') && this.getToken('from') && this.params.outputAmount) {
            return `${title} to ${this.params.outputAmount} ${this.getToken('to').symbol}`;
        }

        return title;
    }

    static perform: (
        index: number,
        account: string,
        ecosystem: string,
        chainId: string,
        options: PerformOptionalParams,
    ) => ICreateTransaction;

    static async getOperationFlow(): Promise<TxOperationFlow[]> {
        return [];
    }

    static async estimateOutput(): Promise<void> {
        // if (Object.keys(this.params).length === 0) return Promise.reject('Params are empty');
    }

    static async performTx(ecosystem: Ecosystems, { token, memo, serviceId }: PerformTxParams): Promise<IBridgeDexTransaction> {
        return Promise.resolve(null);
    }
}
