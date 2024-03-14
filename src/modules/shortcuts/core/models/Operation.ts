import { ShortcutType, ShortcutTypes } from '../types/ShortcutType';

export interface IOperationParam {
    name: string;
    disabled: boolean;
    ecosystem?: string;
    chainId?: string | number;
    chain?: string;
    id?: string;
    address?: string;
    type?: string; // Optional if you want to include a type field
    memo?: string; // Optional if you want to include a memo field
}

export interface IOperation {
    id: string;
    name: string;
    type: ShortcutTypes;
    operationType: string;
    moduleType: string;
    paramsInterface: string;
    layoutComponent: string;
    layoutComponentProps?: any;
    params: IOperationParam[];
    operations?: IOperation[];
}

export interface IRecipe {
    id: string;
    operations: IOperation[];
}
