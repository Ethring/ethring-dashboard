export const formatNumber = (value, maximumFractionDigits = 6) => {
    if (!value || +value === 0) {
        return '0';
    }

    if (Number.isNaN(Number(value))) {
        return value;
    }

    const formatter = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: Number(maximumFractionDigits),
        useGrouping: true,
        roundingMode: 'trunc',
    });

    const formattedNumber = formatter.format(value);

    if (+formattedNumber === 0) {
        return '~0';
    }

    return formattedNumber;
};
