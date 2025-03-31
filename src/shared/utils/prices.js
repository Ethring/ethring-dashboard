import moment from 'moment';

import PricesModule from '@/modules/prices/index';
import { PRICE_UPDATE_TIME } from '@/shared/constants/operations';

const getPriceByCoingeckoId = async (coingeckoId) => {
    try {
        const priceById = await PricesModule.Coingecko.marketCapForNativeCoin(coingeckoId);

        const { usd = null } = priceById[coingeckoId] || {};

        if (!usd) return 0;

        const { price = 0 } = usd || {};

        return price;
    } catch (error) {
        console.warn('error while requesting price from Coingecko', error);
        return 0;
    }
};

export const getPriceFromProvider = async (tokenAddress, selectedNetwork, { coingeckoId = null } = {}) => {
    if (coingeckoId) return await getPriceByCoingeckoId(coingeckoId);

    const { net } = selectedNetwork || {};

    const requestPriceFor = {
        net,
        addresses: tokenAddress,
    };

    try {
        const price = await PricesModule.Coingecko.priceByPlatformContracts(requestPriceFor);
        const address = tokenAddress?.toLowerCase() || tokenAddress;

        if (!price[address]) return 0;

        const { usd = 0 } = price[address] || {};

        return usd;
    } catch (error) {
        console.warn('error while requesting price from Coingecko', error);
        return 0;
    }
};

export const assignPriceInfo = async (network, token) => {
    const { coingecko_id: coingeckoId, address, price, priceUpdatedAt } = token || {};

    const isPriceUpdate = moment().diff(moment(priceUpdatedAt), 'milliseconds') > PRICE_UPDATE_TIME;

    if (!price || isPriceUpdate) {
        const fromProvider = await getPriceFromProvider(address, network, { coingeckoId });
        fromProvider && (token.price = fromProvider);
        fromProvider && (token.priceUpdatedAt = new Date().getTime());
    }

    return token;
};
