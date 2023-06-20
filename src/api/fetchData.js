import axios from 'axios';

export const fetchData = async ({ url, route, params }) => {
    let response;

    try {
        response = await axios.get(`${url}${route}`, { params });
        return response.data.data;
    } catch (err) {
        return { error: err.response.data.error };
    }
};
