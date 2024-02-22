import PricesModule from '@/modules/prices/';

const getPriceByCoingeckoId = async (coingeckoId) => {
    try {
        const priceById = await PricesModule.Coingecko.marketCapForNativeCoin(coingeckoId);

        const { usd = null } = priceById[coingeckoId] || {};

        if (!usd) {
            return 0;
        }

        const { price = 0 } = usd || {};

        return price;
    } catch (error) {
        console.warn('error while requesting price from Coingecko', error);
        return 0;
    }
};

export const getPriceFromProvider = async (tokenAddress, selectedNetwork, { coingeckoId = null } = {}) => {
    if (coingeckoId) {
        return await getPriceByCoingeckoId(coingeckoId);
    }

    const { chain_id, chainId } = selectedNetwork || {};

    const requestPriceFor = {
        chainId: chain_id || chainId,
        addresses: tokenAddress,
    };

    try {
        const price = await PricesModule.Coingecko.priceByPlatformContracts(requestPriceFor);
        const address = tokenAddress?.toLowerCase() || tokenAddress;

        if (!price[address]) {
            return 0;
        }

        const { usd = 0 } = price[address] || {};

        return usd;
    } catch (error) {
        console.warn('error while requesting price from Coingecko', error);
        return 0;
    }
};
