export const checkErrors = (error) => {
    console.log('error', error.message);
    if (error && error.data) {
        return { error: error?.data?.message || error };
    }

    return { error: error.message || JSON.stringify(error) };
};
