import ApiClient from '@/core/shortcuts/api/axios';

import { IShortcutData } from '@/core/shortcuts/core/Shortcut';

const getShortcuts = async (params: any) => {
    try {
        const response = await ApiClient.get('/shortcuts', { params });

        return response.data as IShortcutData[];
    } catch (error) {
        console.error('getShortcuts', error);

        throw [];
    }
};

const getShortcutById = async (id: string) => {
    try {
        const response = await ApiClient.get(`/shortcuts/${id}`);

        return response.data as IShortcutData;
    } catch (error) {
        console.error(`getShortcutById ${id}`, error);

        throw [];
    }
};

export { getShortcuts, getShortcutById };
