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

        let allTokens = [];

        const isNotEqualToSelected = (tkn, selectedToken) => {
            const ids = [];

            if (selectedToken && selectedToken.id && selectedToken.chain === network.net) {
                ids.push(selectedToken.id);
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
            const tokensListFromNet = getTokensWithAndWithoutBalance('networks', network);
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
                balance: baseToken?.balance || 0,
                balanceUsd: baseToken?.balanceUsd || 0,
            };

            allTokens = [tokenInfo];
        }

        const isFromSelected = selectType.value === TOKEN_SELECT_TYPES.FROM;

        const selectedToken = isFromSelected ? toToken : fromToken;

        allTokens = allTokens.filter((tkn) => isNotEqualToSelected(tkn, selectedToken));

        allTokens = allTokens.map((tkn) => {
            if (isFromSelected && tkn.id === fromToken?.id) {
                return {
                    ...tkn,
                    selected: true,
                }
            } else if (tkn.id === toToken?.id) {
                return {
                    ...tkn,
                    selected: true,
                }
            }
            return tkn;
        })

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
