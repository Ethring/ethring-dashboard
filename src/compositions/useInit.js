import axios from 'axios';
import { ref, computed } from 'vue';
import prices from '@/modules/prices/';
import { ECOSYSTEMS } from '@/Adapter/config';

export default async function useInit(ecosystem, address, store) {
    if (!address) {
        return;
    }

    const disableLoader = computed(() => store.getters['tokens/disableLoader']);
    store.dispatch('tokens/setLoader', true);

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

    // const balanceInfo = async (net) => {
    //     try {
    //         let balance = 0;
    //         if (net !== 'fantom') {
    //             const response = await axios.get(`${process.env.VUE_APP_BACKEND_URL}/blockchain/${net}/${address}/balance`);

    //             if (response.status === 200) {
    //                 return response.data.data;
    //             }
    //         }

    //         return balance;
    //     } catch {
    //         return {};
    //     }
    // };

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
        networksList.value.map(async ({ net, native_token }) => {
            if (ecosystem !== ECOSYSTEMS.EVM) {
                return;
            }
            const tokenList = await tokensInfo(net);
            const balance = tokenList[0];

            tokens[net] = {
                list: tokenList,
                balance,
                price: {
                    BTC: 0,
                    USD: 0,
                },
            };

            try {
                const price = await prices.Coingecko.marketCapForNativeCoin(native_token?.coingecko_id);
                tokens[net].price = {
                    BTC: price.btc?.price,
                    USD: price.usd?.price,
                };
            } catch (error) {
                console.log(error);
            }
            return tokens;
        })
    );

    store.dispatch('tokens/setGroupTokens', tokens);
    store.dispatch('tokens/setLoader', false);
}
