import axios from 'axios';
import { ref, computed } from 'vue';
import prices from '@/modules/prices/';

export default async function useInit(address, store) {
    const disableLoader = computed(() => store.getters['tokens/disableLoader']);
    if (!disableLoader.value) {
        store.dispatch('tokens/setLoader', true);
        store.dispatch('tokens/setFromToken', null);
        store.dispatch('tokens/setToToken', null);
        store.dispatch('bridge/setSelectedSrcNetwork', null);
        store.dispatch('bridge/setSelectedDstNetwork', null);
    } else {
        store.dispatch('tokens/setDisableLoader', false);
    }
    const networksList = ref(store.getters['networks/zometNetworksList']);

    const tokens = {};

    const allTokens = [];

    const allIntegrations = [];

    let totalBalance = 0;

    const balanceInfo = async (net) => {
        try {
            let balance = 0;
            if (net !== 'fantom') {
                const response = await axios.get(`${process.env.VUE_APP_BACKEND_URL}/blockchain/${net}/${address}/balance`);

                if (response.status === 200) {
                    return response.data.data;
                }
            }

            return balance;
        } catch {
            return {};
        }
    };

    const tokensInfo = async (net) => {
        try {
            const response = await axios.get(`${process.env.VUE_APP_ZOMET_CORE_API_URL}/balances/${net}/${address}`);

            if (response.status === 200) {
                return response.data;
            }

            return [];
        } catch {
            return [];
        }
    };

    const assetsInfo = async (net) => {
        try {
            const response = await axios.get(`${process.env.VUE_APP_DATA_PROVIDER_URL}?net=${net}&address=${address}`);

            if (response.status === 200) {
                return response.data.data;
            }

            return null;
        } catch {
            return null;
        }
    };

    for (const { net, logo } of networksList.value) {
        const assets = await assetsInfo(net);

        if (assets?.tokens?.length) {
            allTokens.push(
                ...assets.tokens.map((token) => {
                    token.chainLogo = logo;
                    totalBalance += +token.balanceUsd;
                    return token;
                })
            );
        }

        if (assets?.integrations?.length) {
            assets.integrations.forEach((item) => {
                item.balances.forEach((token) => {
                    token.chainLogo = logo;
                });
                totalBalance += +item.balances.reduce((sum, token) => sum + +token.balanceUsd, 0);
            });
            allIntegrations.push(...assets.integrations);
        }
    }

    store.dispatch('tokens/setTokens', { address, data: allTokens });
    store.dispatch('tokens/setIntegrations', { address, data: allIntegrations });
    store.dispatch('tokens/setTotalBalances', { address, data: totalBalance });

    store.dispatch('tokens/setLoader', false);

    await Promise.all(
        networksList.value.map(async ({ net, native_token }) => {
            const balance = await balanceInfo(net);
            const tokenList = await tokensInfo(net);
            const price = await prices.Coingecko.marketCapForNativeCoin(native_token?.coingecko_id);
            return (tokens[net] = {
                list: tokenList,
                balance,
                price: {
                    BTC: price.btc?.price,
                    USD: price.usd?.price,
                },
            });
        })
    );

    store.dispatch('tokens/setGroupTokens', tokens);
}
