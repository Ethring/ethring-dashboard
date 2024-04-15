import { AvailableShortcuts } from './shortcuts';
import { getAuthorById } from './authors';
import { getRecipeById } from './recipes';
import { getShortcutMetaById } from './meta-data';

type RequestDataType = 'ALL' | 'META' | 'RECIPE' | 'AUTHOR';

const getAvailableShortcuts = () => {
    const availableShortcuts = Object.values(AvailableShortcuts) || [];

    if (!availableShortcuts.length) {
        console.warn('No shortcuts available');
        return [];
    }

    return availableShortcuts;
};

const getAllShortcuts = (type: RequestDataType = 'ALL', limit: number = 10, offset: number = 0) => {
    const availableShortcuts = getAvailableShortcuts();

    switch (type) {
        case 'META':
            return availableShortcuts.map((key) => getShortcutMetaById(key)).slice(offset, limit);

        case 'RECIPE':
            return availableShortcuts.map((key) => getRecipeById(key)).slice(offset, limit);

        default:
            return availableShortcuts
                .map((key) => {
                    return {
                        ...getShortcutMetaById(key),
                        recipe: getRecipeById(key),
                    };
                })
                .slice(offset, limit);
    }
};

const getDataByIdAndType = (id: string, type: RequestDataType = 'ALL') => {
    switch (type) {
        case 'META':
            return getShortcutMetaById(id);

        case 'RECIPE':
            return getRecipeById(id);

        case 'AUTHOR':
            return getAuthorById(id);

        default:
            return {
                ...getShortcutMetaById(id),
                recipe: getRecipeById(id),
            };
    }
};

const getShortcutsByAuthor = (authorId: string) => {
    const availableShortcuts = getAvailableShortcuts();

    return availableShortcuts
        .map((key) => {
            const meta = getShortcutMetaById(key);
            if (meta.author.id === authorId)
                return {
                    ...meta,
                    recipe: getRecipeById(key),
                };
        })
        .filter((item) => item);
};

export { getAllShortcuts, getDataByIdAndType, getShortcutsByAuthor };
