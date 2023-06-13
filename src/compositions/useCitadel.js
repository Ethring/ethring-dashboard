import axios from 'axios';
import { computed } from 'vue';

import { metamaskNets } from '@/config/availableNets';

export default async function useCitadel(address, store) {
    store.dispatch('tokens/setLoader', true);
    store.dispatch('tokens/setFromToken', null);
    store.dispatch('tokens/setToToken', null);

    const groupTokens = computed(() => store.getters['tokens/groupTokens']);

    const tokens = {};

    const balanceInfo = async (net) => {
        let balance = 0;
        const response = await axios.get(`${process.env.VUE_APP_BACKEND_URL}/blockchain/${net}/${address}/balance`);

        if (response.status === 200) {
            return response.data.data;
        }

        return balance;
    };

    const tokensInfo = async (net) => {
        const response = await axios.get(`${process.env.VUE_APP_BACKEND_URL}/blockchain/${net}/${address}/tokens?version=1.1.0`);

        if (response.status === 200) {
            return response.data.data;
        }

        return {};
    };

    const priceInfo = async (net) => {
        let price = null;
        const result = await axios.get(`https://work.3ahtim54r.ru/api/currency/${net}/`);
        if (result.status === 200) {
            price = result.data.data;
        }
        return price;
    };

    const promises = metamaskNets.map(async (net) => {
        const balance = await balanceInfo(net);
        const tokenList = await tokensInfo(net);
        const price = await priceInfo(net);

        tokens[net] = { list: tokenList, balance, price, balanceUsd: balance.mainBalance * price.USD };
    });

    await Promise.all(promises);

    if (JSON.stringify(groupTokens.value) !== '{}') {
        store.dispatch('tokens/setGroupTokens', tokens);
        store.dispatch('tokens/setLoader', false);

        return;
    }

    store.dispatch('tokens/setGroupTokens', tokens);
    store.dispatch('tokens/setLoader', false);
}
