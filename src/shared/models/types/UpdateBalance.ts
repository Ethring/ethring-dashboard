export interface IUpdateBalanceByHash {
    hash: string;
    addresses: {
        [key: string]: string;
    };
}
