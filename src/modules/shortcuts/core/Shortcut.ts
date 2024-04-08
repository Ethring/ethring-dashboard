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

    recipe?: {
        id: string;
        operations: IShortcutRecipe[] | IShortcutOp[];
    };

    recipes: ShortcutRecipe[];
    operations: IShortcutOp[];
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

    recipe?: {
        id: string;
        operations: IShortcutRecipe[];
    };

    recipes: ShortcutRecipe[];

    operations: ShortcutOp[] = []; // Assuming this is the only possible type

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
        this.recipes = [];

        this.recipe = shortcut.recipe as any;

        const { id, operations: recipeOperations } = shortcut.recipe || {};

        for (const op of recipeOperations || []) {
            switch (op.type) {
                case ShortcutType.recipe:
                    this.processRecipe(op as IShortcutRecipe);
                    break;
                case ShortcutType.operation:
                    this.processOperation(op as IShortcutOp);
                    break;
            }
        }
    }

    processRecipe(recipe: IShortcutRecipe) {
        this.recipes.push(new ShortcutRecipe(recipe));

        const { operations = [] } = recipe;

        for (const op of operations) {
            this.operations.push(new ShortcutOp(op as IShortcutOp));
        }
    }

    processOperation(operation: IShortcutOp) {
        this.operations.push(new ShortcutOp(operation));
    }
}
