const REMOVE_KEYS = ['value', 'currency', 'symbol', 'contractAddress', 'tokenBalance'];

export const setTokenPriceInfo = (token = {}, priceInfo = {}) => {
    token.balance = {
        amount: token.value,
        price: {
            BTC: priceInfo.btc,
            USD: priceInfo.usd,
        },
    };

    if (typeof priceInfo.btc === 'object') {
        token.balance.price.BTC = priceInfo.btc.price;
        token.balance.price.USD = priceInfo.usd.price;
    }

    token.balanceUsd = token.balance.amount * token.balance.price.USD;

    const tokenInfo = {
        ...token,
        ...token?.currency,
        code: token?.currency?.symbol || token?.symbol,
    };

    if (tokenInfo.contractAddress) {
        tokenInfo.address = tokenInfo.contractAddress;
    }

    REMOVE_KEYS.forEach((key) => delete tokenInfo[key]);

    return tokenInfo;
};
