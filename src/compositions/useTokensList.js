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

        if (ECOSYSTEMS.COSMOS === network?.ecosystem) {
            for (const token of tokensWithBalance) {
                if (!token.symbol.includes('IBC.')) {
                    continue;
                }

                const searchSymbol = token.symbol.replace('IBC.', '');
                const result = tokensListFromNet.find((searchToken) => searchToken.symbol === searchSymbol);

                if (result) {
                    token.address = result.base;
                    token.coingecko_id = result.coingecko_id;
                }
            }
        }

        let allTokens = [];

        const isNotEqualToSelected = (tkn) => {
            const ids = [];

            if (fromToken && fromToken.id) {
                ids.push(fromToken.id);
            }

            if (toToken && toToken.id) {
                ids.push(toToken.id);
            }

            if (tkn.id) {
                return !ids.includes(tkn.id);
            }

            return true;
        };

        // Target tokens list with or without balance
        if (onlyWithBalance.value) {
            allTokens = tokensWithBalance;
        } else {
            allTokens = _.unionBy(tokensWithBalance, tokensListFromNet, (tkn) => tkn.address?.toLowerCase());
        }

        // Native token
        if (ECOSYSTEMS.EVM === network?.ecosystem) {
            const { native_token: nativeToken } = network || {};

            const searchId = `${network.net}:asset__native:${nativeToken.symbol}`;

            const baseToken = allTokens.find(({ id }) => id === searchId);

            const tokenInfo = {
                balance: 0,
                balanceUsd: 0,
                ...baseToken,
                ...nativeToken,
            };

            if (!tokenInfo.name) {
                tokenInfo.name = nativeToken.symbol;
            }

            if (!tokenInfo.name.includes('Native Token')) {
                tokenInfo.name += ' Native Token';
            }

            if (baseToken) {
                allTokens = allTokens.filter(({ id }) => id !== searchId);
            }

            allTokens.push(tokenInfo);
        }

        // Native token only for COSMOS
        if (ECOSYSTEMS.COSMOS === network?.ecosystem) {
            const { asset } = network || {};

            const baseToken = allTokens.find(({ symbol }) => symbol === asset.symbol);

            const tokenInfo = {
                ...asset,
                ...baseToken,
                id: `${network.net}:asset__native:${asset.symbol}`,
                address: asset.base,
                balance: baseToken?.balance || 0,
                balanceUsd: baseToken?.balanceUsd || 0,
            };

            allTokens = [...allTokens.filter(({ symbol }) => symbol !== asset.symbol), tokenInfo];
        }

        allTokens = _.filter(allTokens, isNotEqualToSelected);

        return _.orderBy(
            allTokens,
            [
                // Sorting by balance
                (tkn) => Number(tkn.balanceUsd),
                // Sorting by Native Token
                (tkn) => tkn?.name?.includes('Native Token'),
            ],
            ['desc', 'desc']
        );
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
