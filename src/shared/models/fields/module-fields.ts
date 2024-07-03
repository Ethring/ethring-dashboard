import { Field, FieldAttr } from '@/shared/models/enums/fields.enum';
import { ModuleType } from '@/shared/models/enums/modules.enum';

import { IChainConfig } from '@/shared/models/types/chain-config';
import { AssetBalance } from '@/core/balance-provider/models/types';

export interface AllowanceByService {
    [key: string]: {
        [key: string]: string;
    };
}

export interface INetwork extends IChainConfig {}

export interface IAsset extends AssetBalance {
    allowanceByService?: AllowanceByService;
    amount?: string;
    coingecko_id?: string;
    verified?: boolean;
    selected?: boolean;
}

export interface IFields {
    [Field.srcNetwork]: INetwork;
    [Field.srcToken]: IAsset;
    [Field.dstNetwork]: INetwork;
    [Field.dstToken]: IAsset;
    [Field.srcAmount]: string;
    [Field.dstAmount]: string;
    [Field.switchDirection]: boolean;
    [Field.receiverAddress]: string;
    [Field.memo]: string;
    [Field.isSendToAnotherAddress]: boolean;
    [Field.contractAddress]?: string;
    [Field.contractCallCount]?: number;
    [Field.funds]?: {
        amount: string;
        denom: string;
    };
    [Field.slippage]?: number;
}

type SendExcludeFields = Field.switchDirection | Field.dstNetwork | Field.dstToken | Field.dstAmount | Field.isSendToAnotherAddress;
type SwapExcludeFields = Field.receiverAddress | Field.isSendToAnotherAddress | Field.memo;
type SuperSwapExcludeFields = Field.memo;
type BridgeExcludeFields = Field.memo;
type StakeExcludeFields = Field.dstAmount | Field.dstToken | Field.switchDirection | Field.dstNetwork;

export type ISendFields = Omit<IFields, SendExcludeFields>;
export type ISwapFields = Omit<IFields, SwapExcludeFields>;
export type ISuperSwapFields = Omit<IFields, SuperSwapExcludeFields>;
export type IBridgeFields = Omit<IFields, BridgeExcludeFields>;
export type IStakeFields = Omit<IFields, StakeExcludeFields>;

export interface IFieldState {
    [FieldAttr.disabled]: boolean;
    [FieldAttr.hide]: boolean;
}

// export implementations of Fields for each module
export class SendFields implements ISendFields {
    [Field.srcNetwork]!: INetwork;
    [Field.srcToken]!: IAsset;
    [Field.srcAmount]!: string;
    [Field.receiverAddress]!: string;
    [Field.memo]!: string;
}

export class SwapFields implements ISwapFields {
    [Field.srcNetwork]!: INetwork;
    [Field.srcToken]!: IAsset;
    [Field.dstNetwork]!: INetwork;
    [Field.dstToken]!: IAsset;
    [Field.srcAmount]!: string;
    [Field.dstAmount]!: string;
    [Field.switchDirection]!: boolean;
}

export class SuperSwapFields implements ISuperSwapFields {
    [Field.srcNetwork]!: INetwork;
    [Field.srcToken]!: IAsset;
    [Field.dstNetwork]!: INetwork;
    [Field.dstToken]!: IAsset;
    [Field.srcAmount]!: string;
    [Field.dstAmount]!: string;
    [Field.switchDirection]!: boolean;
    [Field.receiverAddress]!: string;
    [Field.isSendToAnotherAddress]!: boolean;
    [Field.isReload]!: boolean;
}

export class BridgeFields implements IBridgeFields {
    [Field.srcNetwork]!: INetwork;
    [Field.srcToken]!: IAsset;
    [Field.dstNetwork]!: INetwork;
    [Field.dstToken]!: IAsset;
    [Field.srcAmount]!: string;
    [Field.dstAmount]!: string;
    [Field.switchDirection]!: boolean;
    [Field.receiverAddress]!: string;
    [Field.isSendToAnotherAddress]!: boolean;
}

export class StakeFields implements IStakeFields {
    [Field.srcNetwork]!: INetwork;
    [Field.srcToken]!: IAsset;
    [Field.dstNetwork]!: INetwork;
    [Field.srcAmount]!: string;
    [Field.memo]!: string;
    [Field.switchDirection]!: boolean;
    [Field.receiverAddress]!: string;
    [Field.isSendToAnotherAddress]!: boolean;
}

export const FieldsByModule = {
    [ModuleType.send]: SendFields,
    [ModuleType.superSwap]: SuperSwapFields,
    [ModuleType.swap]: SwapFields,
    [ModuleType.bridge]: BridgeFields,
    [ModuleType.stake]: StakeFields,
};

export class AllFields implements IFields {
    [Field.srcNetwork]!: INetwork;
    [Field.srcToken]!: IAsset;
    [Field.dstNetwork]!: INetwork;
    [Field.dstToken]!: IAsset;
    [Field.srcAmount]!: string;
    [Field.dstAmount]!: string;
    [Field.switchDirection]!: boolean;
    [Field.receiverAddress]!: string;
    [Field.memo]!: string;
    [Field.isSendToAnotherAddress]!: boolean;
}
