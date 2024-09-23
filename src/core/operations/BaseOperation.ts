import { ModuleType, ModuleTypes } from '@/shared/models/enums/modules.enum';
import { TxOperationFlow } from '@/shared/models/types/Operations';
import { ICreateTransaction } from '@/core/transaction-manager/types/Transaction';
import { IBridgeDexTransaction, IQuoteRoute } from '@/modules/bridge-dex/models/Response.interface';
import { Ecosystems } from '@/modules/bridge-dex/enums/Ecosystem.enum';
import { IAsset } from '@/shared/models/fields/module-fields';
import { AllQuoteParams } from '@/modules/bridge-dex/models/Request.type';
import { IBaseOperation, BaseOpParams, PerformOptionalParams, PerformTxParams } from '@/core/operations/models/Operations';
import { formatNumber } from '@/shared/utils/numbers';
import { cutAddress } from '@/shared/utils/address';

import { TRANSACTION_TYPES, TX_TYPES } from '@/core/operations/models/enums/tx-types.enum';
import { getActionByTxType } from './shared/utils';
import { STATUSES } from '../../shared/models/enums/statuses.enum';

const DEFAULT_TX_TYPE_BY_MODULE = {
    [ModuleType.stake]: TRANSACTION_TYPES.STAKE,
    [ModuleType.swap]: TRANSACTION_TYPES.DEX,
    [ModuleType.send]: TRANSACTION_TYPES.TRANSFER,
    [ModuleType.bridge]: TRANSACTION_TYPES.BRIDGE,
    [ModuleType.superSwap]: TRANSACTION_TYPES.BRIDGE,
    [ModuleType.shortcut]: TRANSACTION_TYPES.BRIDGE,
    [ModuleType.nft]: TRANSACTION_TYPES.EXECUTE_MULTIPLE,
    [ModuleType.pendleSilo]: TRANSACTION_TYPES.SWAP_TOKEN_TO_PT,
};

export class BaseOperation implements IBaseOperation {
    transactionType: TX_TYPES = '' as TX_TYPES;
    uniqueId: string = '';
    make: TX_TYPES = '' as TX_TYPES;
    name: string = '';
    service: any = null;
    ecosystem: Ecosystems = 'EVM';
    module: keyof typeof ModuleType = ModuleType.swap;
    params: BaseOpParams = {} as BaseOpParams;
    chainId: string = '';
    account: string = '';
    tokens: {
        from?: IAsset;
        to?: IAsset;
    } = {};
    quoteRoute?: IQuoteRoute;
    txResponse: any;
    waitTime: number = 3.5;

    flow: TxOperationFlow[] = [];
    isNeedApprove: boolean = false;
    abortController: AbortController;

    constructor() {
        this.service = null;
        this.setTxType(DEFAULT_TX_TYPE_BY_MODULE[this.module]);
        this.abortController = new AbortController();
    }

    onSuccess?: (store: any) => Promise<void>;

    setAction?: (action: string) => void;

    setMake(make: TX_TYPES): void {
        this.make = make;
    }

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

    setTokens(tokens: { from: IAsset; to?: IAsset }): void {
        this.tokens = tokens;
    }

    setToken(target: 'from' | 'to', token: IAsset): void {
        !this.tokens && (this.tokens = {});
        this.tokens[target] = token;
    }

    getTokens(): { from?: IAsset; to?: IAsset } {
        return this.tokens;
    }

    getToken(target: 'from' | 'to'): IAsset | null {
        if (!this.tokens) return null;
        if (!this.tokens[target]) return null;

        return this.tokens[target];
    }
    setTxType(type: TX_TYPES): void {
        this.transactionType = type;
    }

    setQuoteRoute(route: IQuoteRoute): void {
        this.quoteRoute = route;
    }

    getQuoteRoute(): IQuoteRoute {
        return this.quoteRoute as IQuoteRoute;
    }

    getNotificationInfo(make: string): {
        title: string;
        description?: string;
    } {
        const module = this.getModule() as ModuleType;
        const { count = 0, outputAmount = 0, amount, receiverAddress = '' } = this.getParams();
        const { from, to } = this.getTokens() || {};

        const fromTokenTitle = Number(amount) > 0 && from?.symbol ? `${formatNumber(amount)} ${from.symbol}` : '';
        let toTokenTitle = Number(outputAmount) > 0 && to?.symbol ? `For ${formatNumber(outputAmount)} ${to.symbol}` : '';

        if (this.transactionType === TRANSACTION_TYPES.APPROVE) toTokenTitle = '';

        const notification = {
            title: '',
            description: '',
        };

        switch (this.transactionType) {
            case TRANSACTION_TYPES.APPROVE:
                notification.title = `APPROVE ${fromTokenTitle}`;
                break;
            case TRANSACTION_TYPES.SWAP_TOKEN_TO_PT:
                notification.title = `SWAP ${fromTokenTitle} to PT`;
                break;

            case TRANSACTION_TYPES.SWAP:
                notification.title = `SWAP ${fromTokenTitle}`;
                notification.description = toTokenTitle;
                break;

            case TRANSACTION_TYPES.BRIDGE:
                notification.title = `BRIDGE ${fromTokenTitle}`;
                notification.description = toTokenTitle;
                break;

            case TRANSACTION_TYPES.STAKE:
                notification.title = `STAKE ${fromTokenTitle}`;
                break;

            case TRANSACTION_TYPES.TRANSFER:
                notification.title = `SEND ${fromTokenTitle} to ${cutAddress(receiverAddress, 6, 4)}`;
                break;

            case TRANSACTION_TYPES.EXECUTE_MULTIPLE:
                module === ModuleType.nft && (notification.title = `MINT ${count} NFTs`);
                break;

            case TRANSACTION_TYPES.REMOVE_LIQUIDITY:
                notification.title = `REMOVE LIQUIDITY ${fromTokenTitle}`;
                break;

            default:
                notification.title = `${make} ${fromTokenTitle}`;
                toTokenTitle && (notification.description = toTokenTitle);
                break;
        }

        return notification;
    }

    getAdditionalTooltip() {
        const { from, to } = this.getTokens() || {};
        const { amount, outputAmount } = this.getParams() || {};

        const type = this.transactionType;

        if (from && !to && !outputAmount && !amount) return `${type} ${from.symbol}`;

        return '';
    }

    getTxResponse() {
        return this.txResponse;
    }

    setTxResponse(response: any) {
        this.txResponse = response;
    }

    perform(index: number, account: string, ecosystem: string, chainId: string, { make }: PerformOptionalParams): ICreateTransaction {
        const isStake = this.getModule() === ModuleType.stake;

        isStake && this.setTxType(TRANSACTION_TYPES.STAKE);

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
                params: this.params,
                tokens: this.getTokens(),
            },
        } as ICreateTransaction;
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

    setWaitTime(waitTime: number): void {
        this.waitTime = waitTime;
    }

    getWaitTime(): number {
        return this.waitTime || 3.5;
    }

    setNeedApprove(flag: boolean): void {
        this.isNeedApprove = flag;
    }

    cancelRequest(): void {
        this.abortController.abort();
        this.abortController = new AbortController();
    }

    static async estimateOutput(): Promise<void> {
        return Promise.reject('Not implemented');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static async performTx(ecosystem: Ecosystems, { serviceId }: PerformTxParams): Promise<IBridgeDexTransaction> {
        return Promise.reject('Not implemented');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static async onSuccess(store: any): Promise<void> {
        return Promise.resolve();
    }
}
