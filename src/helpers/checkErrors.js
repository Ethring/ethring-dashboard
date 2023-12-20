import { ERRORS } from '@/shared/constants/super-swap/constants';

const ERRORS_REGEX = new RegExp(Object.keys(ERRORS).join('|'), 'i');

export function checkErrors(error) {
    error = error?.data?.message || error?.message || error;

    const errorCodes = error.match(ERRORS_REGEX);

    if (errorCodes) {
        error = ERRORS[errorCodes[0]];
    }

    return { error };
}
