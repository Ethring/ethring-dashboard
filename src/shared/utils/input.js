export const formatInputNumber = (val) => {
    val = val
        .toString()
        // remove spaces
        .replace(/\s+/g, '')
        .replace(',', '.')
        // only number
        .replace(/[^.\d]+/g, '')
        // remove extra 0 before decimal
        .replace(/^0+/, '0')
        // remove extra dots
        .replace(/^0+(\d+)/, '$1')
        // eslint-disable-next-line no-useless-escape
        .replace(/^([^\.]*\.)|\./g, '$1');

    if (val.indexOf('.') !== val.lastIndexOf('.')) {
        val = val.substr(0, val.lastIndexOf('.'));
    }
    return val;
};
