import { ShortcutStatuses } from '../types/ShortcutType';

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

export interface OperationStep {
    id: string;
    index: number;
    title: any;
    status: ShortcutStatuses;
    description?: string;

    make: string;
    type: string;
    moduleIndex: string;
    operationId: string;

    isShowLayout: boolean;
    disabled?: boolean;
    icon?: any;
}
