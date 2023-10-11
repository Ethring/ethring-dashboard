import _ from 'lodash';

import { computed } from 'vue';

import { useStore } from 'vuex';

export default function useTokensList({ network = null, fromToken = null, toToken = null } = {}) {
    const store = useStore();

    const onlyWithBalance = computed(() => store.getters['tokenOps/onlyWithBalance']);

    const getTokensWithAndWithoutBalance = (storeModule = 'tokens', network) => {
        const { net } = network || {};

        if (!net) {
            return [];
        }

        const list = store.getters[`${storeModule}/getTokensListForChain`](net);

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
            const symbols = [];

            if (fromToken && fromToken.address) {
                addresses.push(fromToken.address.toLowerCase());
            } else if (fromToken && fromToken.symbol) {
                symbols.push(fromToken.symbol);
            }

            if (toToken && toToken.address) {
                addresses.push(toToken.address.toLowerCase());
            } else if (toToken && toToken.symbol) {
                symbols.push(toToken.symbol);
            }

            if (tkn.address) {
                return !addresses.includes(tkn.address.toLowerCase());
            } else if (tkn.symbol) {
                return !symbols.includes(tkn.symbol);
            }

            return true;
        };

        if (onlyWithBalance.value) {
            allTokens = tokensWithBalance;
        } else {
            allTokens = _.unionBy(tokensWithBalance, tokensListFromNet, (tkn) => tkn.address?.toLowerCase());
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
