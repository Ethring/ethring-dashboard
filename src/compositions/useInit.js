import axios from 'axios';
import { ref, computed } from 'vue';

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

    const assetsInfo = async (net) => {
        try {
            const response = await axios.get(`${process.env.VUE_APP_DATA_PROVIDER_URL}/balances?net=${net}&address=${address}`);

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
            tokens[net] = {
                list: assets?.tokens,
            };
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

    store.dispatch('tokens/setGroupTokens', tokens);
    store.dispatch('tokens/setLoader', false);
}
