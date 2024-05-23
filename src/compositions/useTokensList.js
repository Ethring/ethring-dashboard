import { unionBy, orderBy, find } from 'lodash';

import { computed } from 'vue';

import { useStore } from 'vuex';

import { ECOSYSTEMS, NATIVE_CONTRACT } from '@/core/wallet-adapter/config';

export default function useTokensList({ network = null, fromToken = null, toToken = null } = {}) {
    const store = useStore();

    const getAccount = (ecosystem) => store.getters['adapters/getAccountByEcosystem'](ecosystem);

    const getTokensFromConfig = async (network) => {
        const { net } = network || {};

        if (!net) return [];

        return await store.dispatch('configs/getTokensListForChain', net);
    };

    const getTokensWithBalance = (network) => {
        const { net, ecosystem } = network || {};

        if (!net) return [];

        const account = getAccount(ecosystem);
        return store.getters['tokens/getTokensListForChain'](net, { account });
    };

    const getAllTokensList = async (network, fromToken, toToken, { onlyWithBalance = false, exclude = [] }) => {
        if (!network) return [];

        const tokensWithBalance = getTokensWithBalance(network);
        const tokensListFromNet = await getTokensFromConfig(network);

        let allTokens = [];

        // const isNotEqualToSelected = (tkn, selectedToken) => {
        //     const ids = [];

        //     if (selectedToken && selectedToken.id && selectedToken.chain === network.net) ids.push(selectedToken.id);

        //     if (tkn.coingecko_id && tkn.coingecko_id === selectedToken?.coingecko_id) ids.push(tkn.coingecko_id);

        //     if (!tkn.address && tkn?.coingecko_id === selectedToken?.coingecko_id) return !ids.includes(tkn.coingecko_id);

        //     if (tkn.id) return !ids.includes(tkn.id);

        //     return true;
        // };

        // ======================== Set native token info ========================
        const setNativeTokenInfo = (allTokens) => {
            const getPriceFromConfig = (tokenInfo) => {
                const chainList = computed(() => store.getters['configs/getConfigsListByEcosystem'](network.ecosystem));
                const chainConfig = chainList.value.find(({ net }) => net === tokenInfo.net);
                const { native_token = {} } = chainConfig || {};

                if (native_token?.price) return (tokenInfo.price = native_token?.price || 0);

                return;
            };

            // Native token
            const nativeToken = network.native_token || network.asset;

            if (!nativeToken) return [];

            const searchId = `${network.net}:tokens__native:${nativeToken.symbol}`;

            const baseToken = allTokens.find(({ id }) => id === searchId);

            const tokenInfo = {
                balance: 0,
                balanceUsd: 0,
                net: network.net,
                chain: network.net,
                ...baseToken,
                ...nativeToken,
                price: baseToken?.price || nativeToken?.price || 0,
            };

            if (!tokenInfo.id) tokenInfo.id = searchId;

            if (!tokenInfo.name) tokenInfo.name = nativeToken.symbol;

            if (network.ecosystem === ECOSYSTEMS.COSMOS) {
                if (!baseToken) tokenInfo.logo = network.logo;

                tokenInfo.address = nativeToken.base;
                tokenInfo.base = nativeToken.base;
            }

            if (!tokenInfo.name.includes('Native Token')) tokenInfo.name += ' Native Token';

            getPriceFromConfig(tokenInfo);

            if (baseToken) allTokens = allTokens.filter(({ id }) => id !== searchId);

            allTokens.push(tokenInfo);

            return allTokens;
        };

        const tokensListFromNetVerified = tokensListFromNet.filter((token) => token.verified);

        const tokensVerifiedMap = new Map(
            tokensListFromNetVerified.map((token) => [token.address ? token.address.toLowerCase() : NATIVE_CONTRACT, true]),
        );

        let tokensWithBalanceVerified = tokensWithBalance;
        if (tokensListFromNetVerified)
            // Update the tokens list with balance to include the verified status
            tokensWithBalanceVerified = tokensWithBalance.map((token) => ({
                ...token,
                verified: tokensVerifiedMap.has(token?.address?.toLowerCase() || NATIVE_CONTRACT),
            }));

        const { ecosystem } = network || {};

        const account = getAccount(ecosystem);

        // Target tokens list with or without balance
        if (onlyWithBalance && account) allTokens = tokensWithBalanceVerified;
        else allTokens = unionBy(tokensWithBalanceVerified, tokensListFromNet, (tkn) => tkn.address?.toLowerCase());

        // Set native token info
        allTokens = setNativeTokenInfo(allTokens);

        if (exclude.length) allTokens = allTokens.filter((tkn) => !exclude.includes(tkn.id) && !exclude.includes(tkn.coingecko_id));

        if (fromToken || toToken)
            for (const tkn of allTokens) {
                if (network.ecosystem === ECOSYSTEMS.COSMOS && tkn.address && !tkn.base) tkn.base = tkn.address;

                tkn.selected = fromToken?.id === tkn.id || toToken?.id === tkn.id;
            }

        const sortedList = orderBy(
            allTokens,

            [
                // Sorting by selected
                (tkn) => tkn.selected,

                // Sorting by Native Token
                (tkn) => tkn?.id?.includes('tokens__native'),

                // Sorting by balance
                (tkn) => Number(tkn.balanceUsd),

                // Sorting by verified
                (tkn) => tkn.verified,
            ],
            ['desc', 'desc', 'desc'],
        );

        return sortedList;
    };

    const getTokensList = async ({ srcNet = null, srcToken = null, dstToken = null, onlyWithBalance = false, exclude = [] } = {}) => {
        network = srcNet;
        fromToken = srcToken;
        toToken = dstToken;

        return await getAllTokensList(network, fromToken, toToken, { onlyWithBalance, exclude });
    };

    const getTokenById = async (network, tokenId) => {
        try {
            const tokens = await getTokensList({
                srcNet: network,
                onlyWithBalance: false,
            });

            return find(tokens, (token) => token.id.toLowerCase() === tokenId.toLowerCase());
        } catch (error) {
            console.error('getTokenById', error);
        }
    };

    return {
        getTokensList,
        getTokenById,
    };
}
