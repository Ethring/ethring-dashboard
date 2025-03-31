import { IAsset } from '@/shared/models/fields/module-fields';

export interface IPrepareTxCosmos {
    fromAddress: string;
    toAddress: string;
    amount: string;
    token: IAsset;
    memo?: string;
}

export interface IPrepareMultipleExecuteCosmos {
    fromAddress: string;
    amount: string;
    token: IAsset;
    memo?: string;
    count: number;
    contract: string;

    funds: {
        amount: string;
        denom: string;
    }[];

    msgKey: string;
}
