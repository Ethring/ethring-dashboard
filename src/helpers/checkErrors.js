import { ERRORS } from '@/shared/constants/superswap/constants';

export const checkErrors = (error) => {
    if (error && error.data) {
        return { error: error.data.message };
    }

    else if (typeof error === 'string') {
        const errorCodes = error.match(/INSUFFICIENT_FUNDS/);

        if (errorCodes) {
            error = ERRORS[errorCodes];
        }

        return error;
    }

    return { error: error.message || error };
};
