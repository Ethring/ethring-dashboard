import { Ecosystems } from '@/modules/bridge-dex/enums/Ecosystem.enum';
import { IOperationParam } from './models/Operation';
import { ModuleType } from '@/shared/models/enums/modules.enum';
import { ShortcutType } from './types/ShortcutType';
import { TX_TYPES } from '@/core/operations/models/enums/tx-types.enum';

export interface IShortcutOp {
    id: string;
    name: string;
    moduleType: keyof typeof ModuleType;
    make: TX_TYPES;
    operationType: TX_TYPES;
    type: ShortcutType.operation | ShortcutType.recipe;
    layoutComponent: string;
    isShowLayout: boolean;
    waitTime?: number;
    serviceId?: string;
    dependencies?: any;
    excludeChains?: string[]; // exclude chain key list
    excludeTokens?: {
        [chain: string]: string[];
    }; // exclude token id list

    includeTokens?: {
        [chain: string]: string[];
    }; // include token id list
    includeChains?: string[]; // include chain key list

    editableFromAmount?: boolean;
    isNeedFromAmount?: boolean;

    operationParams: {
        net?: string | null;
        fromNet?: string;
        fromToken?: string;
        toNet?: string | null;
        toToken?: string | null;

        // others
        [key: string]: any;
    };

    params: IOperationParam[];

    ecosystems: Ecosystems[];
}

export default class ShortcutOp implements IShortcutOp {
    id: string;
    name: string;
    type: ShortcutType.operation | ShortcutType.recipe;
    operationType: TX_TYPES;
    moduleType: keyof typeof ModuleType;
    serviceId?: string = '';
    paramsInterface?: string;
    layoutComponent: string;
    isShowLayout: boolean;
    editableFromAmount: boolean = false;
    isNeedFromAmount: boolean = false;

    waitTime?: number = 3.5;

    operationParams: {
        fromNet?: string;
        fromToken?: string;
        toNet?: string | null;
        toToken?: string | null;
        net?: string | null;
        [key: string]: any;
    };

    params: IOperationParam[];

    dependencies?: any;

    ecosystems: Ecosystems[];

    excludeChains?: string[];
    excludeTokens?: {
        [chain: string]: string[];
    };

    includeTokens?: {
        [chain: string]: string[];
    };
    includeChains?: string[];

    make: TX_TYPES;

    constructor(shortcut: IShortcutOp) {
        this.id = shortcut.id;
        this.name = shortcut.name;
        this.type = shortcut.type;
        this.serviceId = shortcut.serviceId;
        this.operationType = shortcut.operationType;
        this.moduleType = shortcut.moduleType;
        this.editableFromAmount = shortcut.editableFromAmount || false;
        this.isNeedFromAmount = shortcut.isNeedFromAmount || false;
        this.layoutComponent = shortcut.layoutComponent;
        this.operationParams = shortcut.operationParams;
        this.params = shortcut.params;
        this.dependencies = shortcut.dependencies;
        this.ecosystems = shortcut.ecosystems;
        this.isShowLayout = shortcut.isShowLayout;

        this.make = shortcut.make;

        this.includeTokens = shortcut.includeTokens || {};
        this.excludeTokens = shortcut.excludeTokens || {};

        this.includeChains = shortcut.includeChains || [];
        this.excludeChains = shortcut.excludeChains || [];

        this.waitTime = shortcut.waitTime || 3.5;
    }
}
