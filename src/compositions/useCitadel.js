import { metamaskNets } from '@/config/availableNets';
import axios from 'axios';

export default async function useCitadel(address, store) {
    store.dispatch('tokens/setLoader', true);
    store.dispatch('tokens/setGroupTokens', {});

    const tokens = {};

    await Promise.all(
        metamaskNets.map(async (net) => {
            let balance = 0;
            // balance parent network
            const response = await axios.get(`${process.env.VUE_APP_BACKEND_URL}/blockchain/${net}/${address}/balance`);
            if (response.status === 200) {
                balance = response.data.data;
            }

            // tokens child
            const tokenInfo = await axios.get(`${process.env.VUE_APP_BACKEND_URL}/blockchain/${net}/${address}/tokens?version=1.1.0`);
            // check status and exist tokens in network
            if (
                tokenInfo.status === 200 // && Object.keys(tokenInfo.data.data).length
            ) {
                tokens[net] = { list: tokenInfo.data.data, balance };
            }
        })
    );

    store.dispatch('tokens/setGroupTokens', tokens);
    store.dispatch('tokens/setLoader', false);
}
