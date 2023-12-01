import BigNumber from 'bignumber.js';

const cutNumber = (number, digits = 0) =>
    Math.floor(
        BigNumber(number)
            .multipliedBy(10 ** digits)
            .toNumber()
    ) /
    10 ** digits;
const formatValue = (value) => value.toString().trim().replaceAll(',', '');

const classesAbb = {
    0: '',
    3: 'K',
    6: 'M',
    9: 'B',
    12: 'T',
    15: 'q',
    18: 'Q',
};

export const prettyNumber = (value) => {
    if (!value) {
        return 0;
    }

    // for string with range (iost APY "4.8-36.13" etc)
    if (Number.isNaN(+value)) {
        return value;
    }

    const formattedValue = formatValue(value);

    const abbDecimals = 2;
    const maxDecimals = 5;
    const prefix = +formattedValue < 0 ? '-' : '';
    const absoluteValue = Math.abs(formattedValue);
    const intPart = Math.floor(absoluteValue);
    const valueRank = intPart === 0 ? 0 : intPart.toString().length;

    // |value| > 1
    if (valueRank > 0) {
        const classes = Object.keys(classesAbb).sort((a, b) => b - a);
        const valueClass = classes.find((i) => valueRank > i);

        return `${prefix}${cutNumber(absoluteValue / 10 ** valueClass, abbDecimals)}${classesAbb[valueClass]}`;
    }

    // |value| < 1
    if (absoluteValue && cutNumber(absoluteValue, maxDecimals) === 0) {
        return '~0';
    }

    return `${prefix}${cutNumber(absoluteValue, maxDecimals)}`;
};

export const prettyNumberTooltip = (value, maxDecimals = 8) => {
    if (!value) {
        return '0';
    }

    if (Number.isNaN(+value)) {
        return value;
    }

    const formattedValue = formatValue(value);

    return cutNumber(formattedValue, maxDecimals).toLocaleString('en', {
        maximumFractionDigits: maxDecimals,
    });
};

export const formatNumber = (value, maximumFractionDigits = 6) => {
    if (!value || Number.isNaN(+value)) {
        return '0';
    }

    const formatter = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits,
        useGrouping: true,
    });

    const formattedNumber = formatter.format(value);

    if (+formattedNumber === 0) {
        return '~0';
    }

    return formattedNumber;
};
