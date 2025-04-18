import ShortcutOp, { IShortcutOp } from './ShortcutOp';
import ShortcutRecipe, { IShortcutRecipe } from './ShortcutRecipes';
import { ShortcutType } from './types/ShortcutType';

export interface IShortcutData {
    id: string;
    name: string;
    logoURI: string;
    keywords: string[] | null;
    tags: string[];
    minUsdAmount: number;
    type: string;
    description: string;
    website: string;
    wallpaper: string;

    recipe?: {
        id: string;
        operations: IShortcutRecipe[] | IShortcutOp[];
    };

    recipes?: ShortcutRecipe[];
    operations?: IShortcutOp[];
    isComingSoon?: boolean;
    isActive?: boolean;

    networksConfig: {
        fullEcosystems: string[];
        additionalNetworks: string[];
    };

    callShortcutMethod?: string;
}

export default class Shortcut implements IShortcutData {
    id: string;
    name: string;
    logoURI: string;
    keywords: string[] | null;
    tags: string[];
    type: string;
    description: string;
    minUsdAmount: number;
    website: string;
    wallpaper: string;

    recipe?: {
        id: string;
        operations: IShortcutRecipe[];
    };

    recipes: ShortcutRecipe[];

    operations: ShortcutOp[] = [];
    isComingSoon?: boolean;

    isActive?: boolean = true;

    networksConfig: {
        fullEcosystems: string[];
        additionalNetworks: string[];
    };

    callShortcutMethod?: string;

    constructor(shortcut: IShortcutData) {
        if (!shortcut) throw new Error('Shortcut data is required');
        if (!shortcut.id) throw new Error('Shortcut id is required');

        this.id = shortcut.id;
        this.name = shortcut.name;
        this.logoURI = shortcut.logoURI;
        this.keywords = shortcut.keywords;
        this.tags = shortcut.tags;
        this.type = shortcut.type;
        this.description = shortcut.description;
        this.website = shortcut.website;
        this.minUsdAmount = shortcut.minUsdAmount;
        this.wallpaper = shortcut.wallpaper;
        this.isComingSoon = shortcut.isComingSoon;
        this.isActive = shortcut.isActive;
        this.networksConfig = shortcut.networksConfig;
        this.callShortcutMethod = shortcut.callShortcutMethod;

        this.recipes = [];

        this.recipe = shortcut.recipe as any;

        for (const op of shortcut.operations || [])
            switch (op.type) {
                case ShortcutType.recipe:
                    this.processRecipe(op as IShortcutRecipe);
                    break;
                case ShortcutType.operation:
                    this.processOperation(op as IShortcutOp);
                    break;
            }
    }

    processRecipe(recipe: IShortcutRecipe) {
        this.recipes.push(new ShortcutRecipe(recipe));

        const { operations = [] } = recipe;

        for (const op of operations) this.operations.push(new ShortcutOp(op as IShortcutOp));
    }

    processOperation(operation: IShortcutOp) {
        this.operations.push(new ShortcutOp(operation));
    }
}
