import HttpRequest from '@/shared/utils/request';
import { PLATFORMS } from '@/modules/prices/coingecko/shared/constants';

const PROXY_API = process.env.PROXY_API;

const priceByPlatformContracts = async ({ net = 'bsc', addresses, currencies = 'usd,btc' } = {}) => {
    if (!PROXY_API) return {};

    const platform = PLATFORMS[net];

    if (!platform) return {};

    if (!addresses) return {};

    const url = `${PROXY_API}/token-price/coingecko/${platform}?addresses=${addresses}&currencies=${currencies}`;

    const config = {
        method: 'get',
        url,
    };

    const response = await HttpRequest(config);

    if (response.status !== 200) return {};

    const { data: prices = {} } = response.data;

    return prices;
};

const marketCapForNativeCoin = async (tickers = 'binancecoin') => {
    if (!PROXY_API) return {};

    const url = `${PROXY_API}/marketcaps/coingecko?tickers=${tickers}`;

    const config = {
        method: 'get',
        url,
    };

    try {
        const response = await HttpRequest(config);

        const { data } = response.data;

        return data;
    } catch (error) {
        console.error({ error: error.message });
        return {};
    }
};

export default {
    priceByPlatformContracts,
    marketCapForNativeCoin,
};
