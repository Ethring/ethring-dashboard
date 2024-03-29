export enum ShortcutType {
    recipe = 'recipe',
    operation = 'operation',
}

export type ShortcutTypes = keyof typeof ShortcutType;

export enum ShortcutStatus {
    wait = 'wait',
    finish = 'finish',
    process = 'process',
    currentInProgress = 'currentInProgress',
    estimating = 'estimating',
    error = 'error',
}

export type ShortcutStatuses = keyof typeof ShortcutStatus;
