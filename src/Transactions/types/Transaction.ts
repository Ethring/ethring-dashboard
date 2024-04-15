interface MetaData {
    action: string;
    type: string;
    params?: {
        [key: string]: any;
    };

    [key: string]: any;

    notificationTitle?: string | null;
    notificationDescription?: string | null;
}

export interface ICreateTransaction {
    index: number;
    ecosystem: string;
    module: string;
    account: string;
    chainId: string;
    txHash?: string | null;
    status?: string | null;
    parameters?: any;
    metaData?: MetaData;
}

export interface ITransaction {
    index: number;
    ecosystem: string;
    module: string;
    account: string;
    chainId: string;

    // Optional
    txHash?: string | null;
    status?: string | null;

    parameters?: any;
    metaData?: MetaData;
}

export interface ITransactionResponse {
    id: string | number | null;
    requestID: string;
    index: string | number;
    txHash: string | null;
    ecosystem: string;
    module: string;
    status: string | null;
    parameters: any;
    account: string;
    chainId: string;
    metaData: MetaData;
}
