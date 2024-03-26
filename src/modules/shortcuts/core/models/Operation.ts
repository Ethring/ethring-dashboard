import { ShortcutTypes } from '../types/ShortcutType';

export interface IOperationParam {
    name: string;
    disabled: boolean;
    hide: boolean;

    // Optional fields
    id?: string;
    ecosystem?: string;
    chainId?: string | number;
    chain?: string;
    address?: string;
    type?: string;
    memo?: string;
}
