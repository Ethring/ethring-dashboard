export const checkErrors = (error) => {
    if (error && error.data) {
        return { error: error?.data?.message || error };
    }

    return { error: error.message || JSON.stringify(error) };
};
