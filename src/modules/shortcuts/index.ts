import { Recipe } from '@/modules/shortcuts/core/Recipes';

export class RecipeExecutor {
    recipe: Recipe;

    constructor(recipe: Recipe) {
        this.recipe = recipe;
    }

    execute(): void {
        this.recipe.execute();
    }
}
