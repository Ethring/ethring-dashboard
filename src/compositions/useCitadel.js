import axios from 'axios';
import { computed } from 'vue';

import { metamaskNets } from '@/config/availableNets';

export default async function useCitadel(address, store) {
    store.dispatch('tokens/setLoader', true);

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

    const promises = metamaskNets.map(async (net) => {
        const balance = await balanceInfo(net);
        const tokenList = await tokensInfo(net);

        tokens[net] = { list: tokenList, balance };
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
