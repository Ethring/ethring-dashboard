export const checkErrors = (error) => {
    if (error && error.data) {
        return { error: error.data.message };
    }

    return { error: error.message };
};
