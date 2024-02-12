import _ from 'lodash';

import { computed, inject } from 'vue';

import { useStore } from 'vuex';

import { ECOSYSTEMS } from '@/Adapter/config';

import { TOKEN_SELECT_TYPES } from '@/shared/constants/operations';

export default function useTokensList({ network = null, fromToken = null, toToken = null, isSameNet = true } = {}) {
    const store = useStore();
    const useAdapter = inject('useAdapter');

    const { walletAccount } = useAdapter();

    const selectType = computed(() => store.getters['tokenOps/selectType']);
    const isFromSelected = computed(() => selectType.value === TOKEN_SELECT_TYPES.FROM);

    const getTokensFromConfig = async (network) => {
        const { net } = network || {};

        if (!net) {
            return [];
        }

        return await store.dispatch('configs/getTokensListForChain', net);
    };

    const getTokensWithBalance = (network) => {
        const { net } = network || {};

        if (!net) {
            return [];
        }

        return store.getters['tokens/getTokensListForChain'](net, { account: walletAccount.value });
    };

    const getAllTokensList = async (network, fromToken, toToken, isSameNet = true, onlyWithBalance = false) => {
        if (!network) {
            return [];
        }

        const tokensWithBalance = getTokensWithBalance(network);
        const tokensListFromNet = await getTokensFromConfig(network);

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
        if (onlyWithBalance) {
            allTokens = tokensWithBalance;
        } else {
            allTokens = _.unionBy(tokensWithBalance, tokensListFromNet, (tkn) => tkn.address?.toLowerCase());
        }

        // Native token
        const nativeToken = network.native_token || network.asset;

        if (!nativeToken) {
            return [];
        }

        const searchId = `${network.net}:tokens__native:${nativeToken.symbol}`;

        const baseToken = allTokens.find(({ id }) => id === searchId);

        const tokenInfo = {
            balance: 0,
            balanceUsd: 0,
            net: network.net,
            ...baseToken,
            ...nativeToken,
        };

        if (!tokenInfo.id) {
            tokenInfo.id = searchId;
        }

        if (!tokenInfo.name) {
            tokenInfo.name = nativeToken.symbol;
        }

        if (network.ecosystem === ECOSYSTEMS.COSMOS) {
            if (!baseToken) {
                tokenInfo.logo = network.logo;
            }
            tokenInfo.address = nativeToken.base;
        }

        if (!tokenInfo.name.includes('Native Token') && network.ecosystem === ECOSYSTEMS.EVM) {
            tokenInfo.name += ' Native Token';
        }

        if (!tokenInfo.price) {
            const chainList = computed(() => store.getters['configs/getConfigsListByEcosystem'](network.ecosystem));
            const token = chainList.value.find(({ net }) => net === tokenInfo.net);

            if (token) {
                tokenInfo.price = token.native_token?.price;
            }
        }

        if (baseToken) {
            allTokens = allTokens.filter(({ id }) => id !== searchId);
        }

        if (tokenInfo.balance > 0 || !allTokens.length) {
            allTokens.push(tokenInfo);
        }

        // Added selected param if token is selected
        const selectedToken = isFromSelected.value ? toToken : fromToken;

        if (fromToken || toToken) {
            if (isSameNet) {
                allTokens = allTokens.filter((tkn) => isNotEqualToSelected(tkn, selectedToken));
            }

            for (const tkn of allTokens) {
                const isSelected = (isFromSelected.value && tkn.id === fromToken?.id) || tkn.id === toToken?.id;
                tkn.selected = isSelected;
            }
        }

        const sortedList = _.orderBy(
            allTokens,

            [
                // Sorting by selected
                (tkn) => tkn.selected,

                // Sorting by Native Token
                (tkn) => tkn?.id?.includes('tokens__native'),

                // Sorting by balance
                (tkn) => Number(tkn.balanceUsd),
            ],
            ['desc', 'desc', 'desc'],
        );

        return sortedList;
    };

    const getTokensList = async ({ srcNet = null, srcToken = null, dstToken = null, isSameNet = true, onlyWithBalance = false } = {}) => {
        network = srcNet;
        fromToken = srcToken;
        toToken = dstToken;

        return await getAllTokensList(network, fromToken, toToken, isSameNet, onlyWithBalance);
    };

    return {
        getTokensList,
    };
}
