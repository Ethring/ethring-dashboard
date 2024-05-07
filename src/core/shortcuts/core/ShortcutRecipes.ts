import { Ecosystems } from '@/modules/bridge-dex/enums/Ecosystem.enum';
import ShortcutOp, { IShortcutOp } from './ShortcutOp';
import { ShortcutType } from './types/ShortcutType';
import { IOperationParam } from './models/Operation';
import { TX_TYPES } from '@/shared/models/enums/statuses.enum';
import { ModuleTypes } from '@/shared/models/enums/modules.enum';

export interface IShortcutRecipe {
    id: string;
    name: string;
    type: ShortcutType.recipe | ShortcutType.operation;
    layoutComponent: string;
    isShowLayout: boolean;

    operations?: IShortcutOp[];
    ecosystems: Ecosystems[];
}

export default class ShortcutRecipe implements IShortcutRecipe {
    id: string;
    name: string;
    type: ShortcutType.recipe | ShortcutType.operation;
    layoutComponent: string;
    isShowLayout: boolean;
    ecosystems: Ecosystems[];

    operations?: IShortcutOp[];

    constructor(recipe: IShortcutRecipe) {
        this.id = recipe.id;
        this.name = recipe.name;
        this.layoutComponent = recipe.layoutComponent;
        this.isShowLayout = recipe.isShowLayout;
        this.ecosystems = recipe.ecosystems;

        this.type = recipe.type;

        this.operations = recipe.operations.map((op: any) => new ShortcutOp(op));
    }
}
