import _ from 'lodash';

import { computed } from 'vue';

import { useStore } from 'vuex';

import { ECOSYSTEMS } from '@/Adapter/config';

import { TOKEN_SELECT_TYPES } from '@/shared/constants/operations';

import useAdapter from '@/Adapter/compositions/useAdapter';

export default function useTokensList({ network = null, fromToken = null, toToken = null } = {}) {
    const store = useStore();

    const { walletAccount } = useAdapter();

    const onlyWithBalance = computed(() => store.getters['tokenOps/onlyWithBalance']);

    const selectType = computed(() => store.getters['tokenOps/selectType']);

    const getTokensWithAndWithoutBalance = (storeModule = 'tokens', network) => {
        const { net } = network || {};

        if (!net) {
            return [];
        }

        const list = store.getters[`${storeModule}/getTokensListForChain`](net, { account: walletAccount.value });

        return _.orderBy(list, (tkn) => Number(tkn.balanceUsd), ['desc']);
    };

    const getAllTokensList = (network, fromToken, toToken) => {
        if (!network) {
            return [];
        }

        const tokensWithBalance = getTokensWithAndWithoutBalance('tokens', network);

        const tokensListFromNet = getTokensWithAndWithoutBalance('networks', network);

        let allTokens = [];

        const isNotEqualToSelected = (tkn, selectedToken) => {
            const addresses = [];
            const symbols = [];

            if (selectedToken && selectedToken.address && selectedToken.chain === network.net) {
                addresses.push(selectedToken.address.toLowerCase());
            } else if (selectedToken && selectedToken.symbol && selectedToken.chain === network.net) {
                symbols.push(selectedToken.symbol);
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

        if (selectType.value === TOKEN_SELECT_TYPES.FROM) {
            allTokens = allTokens.filter((tkn) => isNotEqualToSelected(tkn, toToken)).map((tkn) => {
                if ((tkn.address === fromToken?.address || tkn.symbol === fromToken?.symbol) && tkn.chain === fromToken.chain && fromToken.chain === network.net) {
                    return {
                        ...tkn,
                        selected: true,
                    };
                }
                return tkn;
            });
        } else if (selectType.value === TOKEN_SELECT_TYPES.TO) {
            allTokens = allTokens.filter((tkn) => isNotEqualToSelected(tkn, fromToken)).map((tkn) => {
                if ((tkn.address === toToken?.address || tkn.symbol === toToken?.symbol) && toToken.chain === network.net) {
                    return {
                        ...tkn,
                        selected: true,
                    };
                }
                return tkn;
            });
        }

        return _.orderBy(allTokens, (tkn) => Number(tkn.balanceUsd), ['desc']);
    };

    const allTokensList = computed(() => getAllTokensList(network, fromToken, toToken));

    const getTokensList = ({ srcNet = null, srcToken = null, dstToken = null } = {}) => {
        network = srcNet;
        fromToken = srcToken;
        toToken = dstToken;

        return getAllTokensList(network, fromToken, toToken);
    };

    return {
        allTokensList,
        getTokensList,
    };
}
