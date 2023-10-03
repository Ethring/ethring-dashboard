import _ from 'lodash';

import { computed } from 'vue';
import { useStore } from 'vuex';

export default function useTokensList({ network = null, fromToken = null, toToken = null } = {}) {
    const store = useStore();

    const onlyWithBalance = computed(() => store.getters['tokenOps/onlyWithBalance']);

    // TODO: loading tokens list for Super_Swap
    const tokensWithBalance = computed(() => {
        const { net } = network || {};

        if (!net) {
            return [];
        }

        const list = store.getters['tokens/getTokensListForChain'](net);

        return _.orderBy(list, (tkn) => Number(tkn.balanceUsd), ['desc']);
    });

    const tokensListFromNet = computed(() => {
        const { net } = network || {};

        if (!net) {
            return [];
        }

        const list = store.getters['networks/getTokensListForChain'](net);

        return _.orderBy(list, (tkn) => Number(tkn.balanceUsd), ['desc']);
    });

    const allTokensList = computed(() => {
        if (!network || !tokensWithBalance.value) {
            return [];
        }

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
            allTokens = tokensWithBalance.value;
        } else {
            allTokens = _.unionBy(tokensWithBalance.value, tokensListFromNet.value, (tkn) => tkn.address?.toLowerCase());
        }

        allTokens = _.filter(allTokens, isNotEqualToSelected);

        return _.orderBy(allTokens, (tkn) => Number(tkn.balanceUsd), ['desc']);
    });

    return {
        allTokensList,
    };
}
