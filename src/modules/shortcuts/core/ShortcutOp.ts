import BridgeDexService, { IBridgeDexService } from '@/modules/bridge-dex';
import { ServiceByModule } from '@/modules/bridge-dex/enums/ServiceType.enum';
import { TxOperationFlow } from '../../../shared/models/types/Operations';
import { Field } from '@/shared/models/enums/fields.enum';
import { ShortcutType } from './types/ShortcutType';
import { TRANSACTION_TYPES } from '../../../shared/models/enums/statuses.enum';
import { ModuleType } from '@/shared/models/enums/modules.enum';
import { IOperationParam } from './models/Operation';
import { Ecosystems } from '@/modules/bridge-dex/enums/Ecosystem.enum';

export interface IShortcutOp {
    id: string;
    name: string;
    type: ShortcutType.operation | ShortcutType.recipe;
    operationType: keyof typeof TRANSACTION_TYPES;
    moduleType: keyof typeof ModuleType;
    layoutComponent: string;
    serviceId?: string;
    skipConditions?: { name: string; value: string }[];
    dependencies?: any;

    operationParams: {
        fromNet: string;
        toNet: string;
        fromToken: string;
        toToken: string;
    };

    params: IOperationParam[];

    ecosystems: Ecosystems[];
}

export default class ShortcutOp implements IShortcutOp {
    id: string;
    name: string;
    type: ShortcutType.operation | ShortcutType.recipe;
    operationType: keyof typeof TRANSACTION_TYPES;
    moduleType: keyof typeof ModuleType;
    serviceId?: string;
    paramsInterface?: string;
    layoutComponent: string;
    skipConditions?: { name: string; value: string }[];

    operationParams: {
        fromNet: string;
        toNet: string;
        fromToken: string;
        toToken: string;
    };

    params: IOperationParam[];

    dependencies?: any;

    ecosystems: Ecosystems[];

    constructor(shortcut: IShortcutOp) {
        this.id = shortcut.id;
        this.name = shortcut.name;
        this.type = shortcut.type;
        this.serviceId = shortcut.serviceId;
        this.operationType = shortcut.operationType;
        this.moduleType = shortcut.moduleType;
        this.layoutComponent = shortcut.layoutComponent;
        this.skipConditions = shortcut.skipConditions;
        this.operationParams = shortcut.operationParams;
        this.params = shortcut.params;
        this.dependencies = shortcut.dependencies;
        this.ecosystems = shortcut.ecosystems;
    }
}
