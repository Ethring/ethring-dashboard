import BigNumber from 'bignumber.js';

export const toMantissa = (value, decimals) => {
    return BigNumber(value).times(BigNumber(10).pow(decimals)).toNumber();
};

export const fromMantissa = (value, decimals) => {
    return BigNumber(value)
        .div(10 ** decimals)
        .toNumber();
};

// TODO: refactor code
export const formatInputNumber = (val) => {
    val = val.replace(/[^0-9.]/g, '');
    if (val.split('.').length - 1 !== 1 && val[val.length - 1] === '.') {
        return val.slice(0, val.length - 1);
    }
    if (val.length === 2 && val[1] !== '.' && val[1] === '0' && val[0] === '0') {
        return val[0];
    } else if (val[0] === '0' && val[1] !== '.') {
        return BigNumber(val).toFixed();
    }
    return val;
};
