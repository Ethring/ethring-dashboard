export enum ShortcutType {
    recipe = 'recipe',
    operation = 'operation',
}

export type ShortcutTypes = keyof typeof ShortcutType;
