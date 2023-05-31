import axios from 'axios';

export const fetchData = async ({ route, params }) => {
    let response;

    try {
        response = await axios.get(`${process.env.VUE_APP_1INCH_SWAP_API}${route}`, {
            params,
        });
        return response.data.data;
    } catch (err) {
        return { error: err.response.data.error };
    }
};
