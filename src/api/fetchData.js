import HttpRequest from '@/shared/utils/request';

export const fetchData = async ({ url, route, params, ...args }) => {
    try {
        return (await HttpRequest.get(`${url}${route}`, { params, ...args })).data.data;
    } catch (err) {
        if (err && err.response) {
            return { error: err.response.data.error };
        }

        return { error: err };
    }
};
