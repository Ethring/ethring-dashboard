import { ModuleTypes } from '@/shared/models/enums/modules.enum';
import { TxOperationFlow } from '@/shared/models/types/Operations';
import { ICreateTransaction } from '@/core/transaction-manager/types/Transaction';
import { IBridgeDexTransaction, IQuoteRoute } from '@/modules/bridge-dex/models/Response.interface';
import { Ecosystems } from '@/modules/bridge-dex/enums/Ecosystem.enum';
import { IAsset } from '@/shared/models/fields/module-fields';
import { AllQuoteParams } from '@/modules/bridge-dex/models/Request.type';
import { TRANSACTION_TYPES, TX_TYPES, STATUSES } from '@/shared/models/enums/statuses.enum';
import { ServiceTypes } from '@/modules/bridge-dex/enums/ServiceType.enum';

export interface IOperationsResultToken {
    from?: {
        symbol: string;
        logo: string;
        amount: string;
    };
    to?: {
        symbol: string;
        logo: string;
        amount: string;
    };
}

export interface IOperationsResult {
    type: TX_TYPES;

    status: keyof typeof STATUSES;

    ecosystem: Ecosystems;

    chainId: string | number | null;

    hash: string | null;

    explorerLink?: string | null;

    tokens: IOperationsResultToken;
}

export type PerformOptionalParams = {
    make: string;
    tokens?: {
        from: IAsset;
        to: IAsset;
    };
};

export type BaseOpParams = AllQuoteParams & {
    memo?: string;
    type?: string;
    outputAmount?: string;
    contract?: string;
    minter?: string;
    count?: number;
    nfts?: string[];
    funds?: {
        amount: string;
        denom: string;
    };
    [key: string]: any;
};

export type PerformTxParams = {
    serviceId?: string;
};

export interface IBaseOperation {
    uniqueId: string;

    name: string;
    params: BaseOpParams;
    module: ModuleTypes;
    ecosystem: Ecosystems;
    chainId: string;

    transactionType?: TX_TYPES;

    txResponse: any;

    tokens: {
        from?: IAsset;
        to?: IAsset;
    };

    account: string;
    service?: any;

    quoteRoute?: IQuoteRoute;

    // Unique Id
    getUniqueId: () => string;
    setUniqueId: (id: string) => void;

    // name
    getName: () => string;
    setName: (name: string) => void;

    // Params
    setParams: (params: any) => void;
    setParamByField: (field: string, value: any) => void;

    getParams: () => BaseOpParams;
    getParamByField: (field: string) => any;

    // chainId for sign
    setChainId: (chainId: string) => void;
    getChainId: () => string;

    // Ecosystems
    getEcosystem: () => Ecosystems;
    setEcosystem: (ecosystem: Ecosystems) => void;

    // Account
    setAccount: (account: string) => void;
    getAccount: () => string;

    // Module
    getModule: () => ModuleTypes;
    setModule: (module: ModuleTypes) => void;

    // Tokens for ops
    setTokens?: (tokens: { from: IAsset; to?: IAsset }) => void;
    getTokens?: () => { from?: IAsset; to?: IAsset };

    getToken(target: 'from' | 'to'): IAsset | null;
    setToken(target: 'from' | 'to', token: IAsset): void;

    // Get Action

    setTxType?: (type: keyof typeof TRANSACTION_TYPES) => void;

    // Execute
    execute?: () => Promise<string>;

    // Estimate output
    estimateOutput?: () => Promise<void>;

    // Get Flow of operations
    getOperationFlow?: () => TxOperationFlow[];

    getTitle: () => string;

    performTx?: (ecosystem: Ecosystems, params: PerformTxParams) => Promise<IBridgeDexTransaction | null>;

    perform?: (index: number, account: string, ecosystem: string, chainId: string, options: PerformOptionalParams) => ICreateTransaction;

    setQuoteRoute?: (route: IQuoteRoute) => void;

    getQuoteRoute: () => IQuoteRoute;
    getServiceType?: () => ServiceTypes;

    getAdditionalTooltip: () => string;

    onSuccess?: (store: any) => Promise<void>;

    setTxResponse: (txResponse: any) => void;
    getTxResponse: () => any;

    getNotificationInfo: (make: string) => { title: string; description?: string };
}

export interface IRegisterOperation {
    key: string;
    module: string;
    index: number;
}

export interface IOperationFactory {
    registerOperation(module: string, operationClass: new () => IBaseOperation, optional?: { id?: string }): IRegisterOperation | null;
    getOperationById(id: string): IBaseOperation;
    getOperationByKey(key: string): IBaseOperation;
    setOperationToGroup(group: string, operationKey: string): void;
    setDependencies(id: string, dependencies: any): void;
    setParams(module: string, operationIndex: number, params: any): void;
    setParamByField(module: string, operationIndex: number, field: string, value: any): void;
    getParams(module: string, operationIndex: number): any;

    getOperationsIds(): Map<string, string>;

    getOperationOrder(): string[];
    resetOperationsStatus(): void;

    getOperationsResult(): any;

    // getOperation(module: string, operationIndex: number): IBaseOperation;
}
