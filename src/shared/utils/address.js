export const cutAddress = (address, start = 10, end = 6) => {
    if (!address || typeof address !== 'string') return '';

    if (address.length < 25) return address;

    return `${address.slice(0, start)}***${address.slice(-end)}`;
};
