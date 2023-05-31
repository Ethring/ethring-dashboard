import BigNumber from 'bignumber.js';

export const toMantissa = (value, decimals) => {
    return BigNumber(value).times(BigNumber(10).pow(decimals)).toNumber();
};

export const fromMantissa = (value, decimals) => {
    return BigNumber(value)
        .div(10 ** decimals)
        .toNumber();
};
