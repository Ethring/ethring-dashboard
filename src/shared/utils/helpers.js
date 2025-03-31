export const delay = (ms) => new Promise((res) => setTimeout(res, ms));

export const searchByKey = (obj = {}, search = '', target = 'symbol') => {
    const targetVal = obj[target] ?? null;
    const targetLC = targetVal ? targetVal.toLowerCase() : '';

    return targetLC.includes(search.toLowerCase());
};
