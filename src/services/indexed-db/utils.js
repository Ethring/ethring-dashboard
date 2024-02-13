export const getFromCacheOrSave = async ({ cacheDB, searchKeys } = {}, requestFn, { saveCacheFn, saveCacheFnKey, addition = {} } = {}) => {
    try {
        const configsObjFromCache = await cacheDB.getAllObjectFrom(...searchKeys);

        const isEmpty = !configsObjFromCache || JSON.stringify(configsObjFromCache) === '{}';

        if (!isEmpty) {
            return configsObjFromCache;
        }
    } catch (error) {
        console.warn('Error get data from cache', error);
    }

    let data = null;
    console.log('getFromCacheOrSave', saveCacheFn, saveCacheFnKey, data, addition);

    try {
        console.log('getFromCacheOrSave', requestFn);
        data = await requestFn();

        return data;
    } catch (error) {
        console.warn('Error get data from API', error);
        return {};
    } finally {
        if (data) {
            await cacheDB[saveCacheFn](saveCacheFnKey, data, addition);
        }
    }
};
