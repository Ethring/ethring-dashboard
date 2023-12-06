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

        if (ECOSYSTEMS.COSMOS === network?.ecosystem) {
            for (const token of tokensWithBalance) {
                if (token.address && token.address.startsWith('IBC')) {
                    token.address = token.address.replace('IBC', 'ibc');
                }

                if (!token.base && token.address) {
                    token.base = token.address;
                }
            }
        }

        let allTokens = [];

        const isNotEqualToSelected = (tkn, selectedToken) => {
            const ids = [];

            if (selectedToken && selectedToken.id && selectedToken.chain === network.net) {
                ids.push(selectedToken.id);
            }

            if (tkn.coingecko_id && tkn.coingecko_id === selectedToken?.coingecko_id) {
                ids.push(tkn.coingecko_id);
            }

            if (!tkn.address && tkn?.coingecko_id === selectedToken?.coingecko_id) {
                return !ids.includes(tkn.coingecko_id);
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

            if (!nativeToken) {
                return [];
            }

            const searchId = `${network.net}:asset__native:${nativeToken.symbol}`;

            const baseToken = allTokens.find(({ id }) => id === searchId);

            const tokenInfo = {
                balance: 0,
                balanceUsd: 0,
                ...baseToken,
                ...nativeToken,
            };

            if (!tokenInfo.id) {
                tokenInfo.id = searchId;
            }

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

        // Added selected param if token is selected
        const isFromSelected = selectType.value === TOKEN_SELECT_TYPES.FROM;

        const selectedToken = isFromSelected ? toToken : fromToken;

        if (selectedToken) {
            allTokens = allTokens.filter((tkn) => isNotEqualToSelected(tkn, selectedToken));

            for (const tkn of allTokens) {
                const isSelected = (isFromSelected && tkn.id === fromToken?.id) || tkn.id === toToken?.id;
                tkn.selected = isSelected;
            }
        }

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
