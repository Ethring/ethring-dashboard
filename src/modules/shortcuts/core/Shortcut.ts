import ShortcutOp, { IShortcutOp } from './ShortcutOp';
import ShortcutRecipe, { IShortcutRecipe } from './ShortcutRecipes';
import { ShortcutType } from './types/ShortcutType';

export interface IShortcutData {
    id: string;
    name: string;
    logoURI: string;
    keywords: string[];
    tags: string[];
    minUsdAmount: number;
    type: 'stake'; // Assuming this is the only possible type
    description: string;
    website: string;
    recipe: {
        id: string;
        operations: (IShortcutRecipe | IShortcutOp)[];
    };
}

export default class Shortcut implements IShortcutData {
    id: string;
    name: string;
    logoURI: string;
    keywords: string[];
    tags: string[];
    type: 'stake'; // Assuming this is the only possible type
    description: string;
    minUsdAmount: number;
    website: string;
    recipe: {
        id: string;
        operations: (ShortcutRecipe | ShortcutOp)[];
    } = {
        id: '',
        operations: [],
    };

    constructor(shortcut: IShortcutData) {
        this.id = shortcut.id;
        this.name = shortcut.name;
        this.logoURI = shortcut.logoURI;
        this.keywords = shortcut.keywords;
        this.tags = shortcut.tags;
        this.type = shortcut.type;
        this.description = shortcut.description;
        this.website = shortcut.website;
        this.minUsdAmount = shortcut.minUsdAmount;

        const { operations = [] } = shortcut.recipe || {};

        for (const op of operations || []) {
            switch (op.type) {
                case ShortcutType.recipe:
                    this.recipe.operations.push(new ShortcutRecipe(op as IShortcutRecipe));
                    break;
                case ShortcutType.operation:
                    this.recipe.operations.push(new ShortcutOp(op as IShortcutOp));
                    break;
            }
        }
    }
}
