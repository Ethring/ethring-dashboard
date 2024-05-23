import { computed } from 'vue';
import { ChainConfig } from '@/modules/chain-configs/types/chain-config';

import PricesModule from '@/modules/prices';

export const setNativeTokensPrices = async (configList: ChainConfig[]) => {
    const coingeckoIds = [];

    const getCoingeckoId = (network: ChainConfig) => {
        const { native_token, coingecko_id: networkCoingeckoID } = network || {};
        const { coingecko_id: tokenCoingeckoID } = native_token;

        return tokenCoingeckoID || networkCoingeckoID;
    };

    for (const network of configList) {
        const { native_token } = network || {};

        if (native_token.price) continue;

        const id = getCoingeckoId(network);
        coingeckoIds.push(id);
    }

    if (!coingeckoIds.length) return;

    const ids = coingeckoIds.join(','); // * Convert array to string for request
    const prices = await PricesModule.Coingecko.marketCapForNativeCoin(ids); // * Get prices for all native tokens

    for (const network of configList) {
        const { native_token } = network || {};

        if (native_token.price) continue;

        const id = getCoingeckoId(network);

        const price = prices[id] || {};

        if (!price) continue;

        const { usd = {} } = price || {};

        native_token.price = usd?.price;
    }
};
