import BigNumber from 'bignumber.js';

export const formatNumber = (value, maximumFractionDigits = 8, separator = true) => {
    if (!value || +value === 0) return '0';

    if (Number.isNaN(Number(value))) return value;

    const formatter = new Intl.NumberFormat('en-US', {
        maximumFractionDigits: Number(maximumFractionDigits),
        roundingMode: 'trunc',
    });

    let formattedNumber = formatter.format(value);

    if (+formattedNumber === 0) {
        const formatter = new Intl.NumberFormat('en-US', {
            maximumFractionDigits: 8,
            roundingMode: 'trunc',
        });

        formattedNumber = formatter.format(value);
    }
    if (!separator) return formattedNumber.replace(',', '');

    return formattedNumber;
};

export const formatUsdNumber = (value) => {
    if (!value || +value === 0 || Number.isNaN(Number(value))) return '0';

    const numericValue = new BigNumber(value);

    if (numericValue.isLessThan(0.01)) return '0.00';

    const formatter = new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 2,
        roundingMode: 'trunc',
    });

    return formatter.format(value);
};
