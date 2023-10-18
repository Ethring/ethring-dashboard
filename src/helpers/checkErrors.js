export const checkErrors = (error) => {
    if (error && error.data && error.data.message) {
        return { error: error.data.message };
    }

    return { error: error.message || error };
};
