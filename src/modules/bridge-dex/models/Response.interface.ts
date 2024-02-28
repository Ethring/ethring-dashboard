import { Ecosystems } from '@/modules/bridge-dex/enums/Ecosystem.enum';
import { EVMTransaction } from '@/modules/bridge-dex/models/Transaction/EvmTx.type';

export type BridgeDexTx = any | EVMTransaction;

export interface IBridgeDexTransaction {
    ecosystem: Ecosystems;
    transaction: BridgeDexTx | IBridgeDexTransaction;
}

type FeeInfo = {
    amount: string;
    currency: string;
};

export interface IQuoteRoute {
    serviceId: string;

    fromAmount: string;
    toAmount: string;
    gasEstimated: string;

    fee: FeeInfo[];
}

export interface IQuoteRoutes {
    best: string;
    routes: IQuoteRoute[];
}

export type QuoteRoutes = {
    best: string;
    routes: IQuoteRoute[];
};

export type ErrorResponse = {
    code: string;
    message: string;
};

export type ResponseBridgeDex = ErrorResponse | IQuoteRoutes | IBridgeDexTransaction[] | string;
