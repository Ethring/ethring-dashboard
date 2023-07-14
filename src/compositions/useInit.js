import axios from 'axios';
import { ref } from 'vue';

export default async function useInit(address, store) {
    store.dispatch('tokens/setLoader', true);
    store.dispatch('tokens/setFromToken', null);
    store.dispatch('tokens/setToToken', null);

    const networksList = ref(store.getters['networks/zometNetworksList']);

    // const groupTokens = computed(() => store.getters['tokens/groupTokens']);

    const tokens = {};

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

    await Promise.all(
        networksList.value.map(async ({ net }) => {
            const balance = await balanceInfo(net);
            const tokenList = await tokensInfo(net);

            return (tokens[net] = {
                list: tokenList,
                balance,
            });
        })
    );

    store.dispatch('tokens/setGroupTokens', tokens);
    store.dispatch('tokens/setLoader', false);
}
