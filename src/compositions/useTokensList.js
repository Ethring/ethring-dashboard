import _ from 'lodash';

import { computed } from 'vue';

import { useStore } from 'vuex';

import { ECOSYSTEMS } from '@/Adapter/config';
import useAdapter from '@/Adapter/compositions/useAdapter';

export default function useTokensList({ network = null, fromToken = null, toToken = null } = {}) {
    const store = useStore();

    const { walletAccount } = useAdapter();

    const onlyWithBalance = computed(() => store.getters['tokenOps/onlyWithBalance']);

    const getTokensWithAndWithoutBalance = (storeModule = 'tokens', network) => {
        const { net } = network || {};

        if (!net) {
            return [];
        }

        const list = store.getters[`${storeModule}/getTokensListForChain`](net, { account: walletAccount.value });

        return _.orderBy(list, (tkn) => Number(tkn.balanceUsd), ['desc']);
    };

    const getAllTokensList = (network) => {
        if (!network) {
            return [];
        }

        const tokensWithBalance = getTokensWithAndWithoutBalance('tokens', network);

        const tokensListFromNet = getTokensWithAndWithoutBalance('networks', network);

        let allTokens = [];

        const isNotEqualToSelected = (tkn) => {
            const addresses = [];

            if (fromToken && fromToken.address) {
                addresses.push(fromToken.address.toLowerCase());
            }

            if (toToken && toToken.address) {
                addresses.push(toToken.address.toLowerCase());
            }

            if (tkn.address) {
                return !addresses.includes(tkn.address.toLowerCase());
            }

            return true;
        };

        if (onlyWithBalance.value) {
            allTokens = tokensWithBalance;
        } else {
            allTokens = _.unionBy(tokensWithBalance, tokensListFromNet, (tkn) => tkn.address?.toLowerCase());
        }

        if (ECOSYSTEMS.COSMOS === network?.ecosystem) {
            const { asset } = network || {};

            const baseToken = allTokens.find(({ symbol }) => symbol === asset.symbol);

            const tokenInfo = {
                ...asset,
                ...baseToken,
                balance: baseToken?.balance || 0,
                balanceUsd: baseToken?.balanceUsd || 0,
            };

            allTokens = [tokenInfo];
        }

        allTokens = _.filter(allTokens, isNotEqualToSelected);

        return _.orderBy(allTokens, (tkn) => Number(tkn.balanceUsd), ['desc']);
    };

    const allTokensList = computed(() => getAllTokensList(network));

    const getTokensList = ({ srcNet = null, srcToken = null, dstToken = null } = {}) => {
        network = srcNet;
        fromToken = srcToken;
        toToken = dstToken;

        return getAllTokensList(network);
    };

    return {
        allTokensList,
        getTokensList,
    };
}
