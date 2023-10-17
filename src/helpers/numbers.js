import BigNumber from 'bignumber.js';

export const toMantissa = (value, decimals) => {
    return BigNumber(value).times(BigNumber(10).pow(decimals)).toNumber();
};

export const fromMantissa = (value, decimals) => {
    return BigNumber(value)
        .div(10 ** decimals)
        .toNumber();
};

export const formatInputNumber = (val) => {
    val = val
        .toString()
        // remove spaces
        .replace(/\s+/g, '')
        .replace(/[БбЮю]/, '.')
        .replace(',', '.')
        // only number
        .replace(/[^.\d]+/g, '')
        // remove extra 0 before decimal
        .replace(/^0+/, '0')
        // remove extra dots
        .replace(/^0+(\d+)/, '$1')
        // eslint-disable-next-line no-useless-escape
        .replace(/^([^\.]*\.)|\./g, '$1');

    return val;
};
