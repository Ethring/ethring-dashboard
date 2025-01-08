import { unionBy, orderBy, find } from 'lodash';

import { computed, ref } from 'vue';

import { Store, useStore } from 'vuex';

import { NATIVE_CONTRACT } from '@/core/wallet-adapter/config';
import { Ecosystem, Ecosystems } from '@/shared/models/enums/ecosystems.enum';
import { IChainConfig } from '@/shared/models/types/chain-config';
import { IAsset } from '@/shared/models/fields/module-fields';

export default function useTokensList({ tmpStore = null }: { tmpStore?: Store<any> | null } = {}) {
    const store = process.env.NODE_ENV === 'test' ? (tmpStore as Store<any>) : useStore();

    const getAccount = (ecosystem: Ecosystems): string | null => store.getters['adapters/getAccountByEcosystem'](ecosystem);

    const getTokensFromConfig = async (chain: string): Promise<IAsset[]> => {
        if (!chain) return [];

        return (await store.dispatch('configs/getTokensListForChain', chain)) || [];
    };

    const getVerifiedTokensFromConfig = async (chain: string): Promise<IAsset[]> => {
        const tokensListFromNet = await getTokensFromConfig(chain);
        return tokensListFromNet.filter((token: IAsset) => token.verified);
    };

    const getVerifiedTokensMap = async ({ chain, tokens }: { chain?: string; tokens?: IAsset[] }): Promise<Map<string, boolean>> => {
        const tokensMap = new Map<string, boolean>();
        tokensMap.set(NATIVE_CONTRACT, true);

        // * if chain is provided, get verified tokens from config
        if (chain) {
            const verifiedTokens = await getVerifiedTokensFromConfig(chain);

            verifiedTokens.forEach((token: IAsset) => {
                if (token.address) tokensMap.set(token.address.toLowerCase(), true);
            });

            return tokensMap;
        }

        // * if chain is not provided, get verified tokens from tokens list
        if (!chain && tokens && tokens.length > 0) {
            tokens.forEach((token: IAsset) => {
                // get only verified tokens
                if (token.address && token.verified) tokensMap.set(token.address.toLowerCase(), true);
            });

            return tokensMap;
        }

        return tokensMap;
    };

    const getTokensWithBalance = (chain: string, ecosystem: Ecosystems, account?: string): IAsset[] => {
        if (!chain) return [];
        if (!ecosystem) return [];

        if (!account) {
            const accountByEcosystem = getAccount(ecosystem);
            return store.getters['tokens/getTokensListForChain'](chain, { account: accountByEcosystem });
        }

        return store.getters['tokens/getTokensListForChain'](chain, { account }) || [];
    };

    const validateVerifiedTokens = (tokensWithBalance: IAsset[], verifiedTokensMap: Map<string, boolean>): IAsset[] => {
        return tokensWithBalance.map((token: IAsset) => ({
            ...token,
            verified: verifiedTokensMap.has(token?.address?.toLowerCase() || NATIVE_CONTRACT) || false,
        }));
    };

    const getPriceFromConfig = (ecosystem: Ecosystems, chain: string): number => {
        const chainList = computed<IChainConfig[]>(() => store.getters['configs/getConfigsListByEcosystem'](ecosystem));
        const chainConfig = chainList.value.find(({ net }) => net === chain);

        // !if there is no chainConfig, return
        if (!chainConfig) return 0;

        const { native_token } = chainConfig || {};

        // !if there is no native_token, return
        if (!native_token) return 0;

        if (native_token && native_token?.price) return native_token.price;

        return 0;
    };

    const setNativeTokenInfo = (network: IChainConfig, allTokens: IAsset[]): IAsset[] => {
        const info = network.native_token || network.asset;

        const NATIVE_TOKEN_ID = `${network.net}:tokens__native:${info.symbol}`;

        if (NATIVE_TOKEN_ID.includes('undefined')) return allTokens;

        const nativeToken: any = {
            ...info,
            chain: network.net,
            balance: 0,
            balanceUsd: 0,
            price: 0,
            priceChange: 0,
            address: null,
            base: network.asset?.base || null,
            chainLogo: '',
            id: NATIVE_TOKEN_ID,
        };

        const tokenFromList = allTokens.find(({ id }) => id === NATIVE_TOKEN_ID) as IAsset;

        const tokenInfo: IAsset = {
            ...tokenFromList,
            ...nativeToken,
            chain: network.net,
            balance: tokenFromList?.balance || 0,
            balanceUsd: tokenFromList?.balanceUsd || 0,
            price: tokenFromList?.price || nativeToken?.price || 0,
            verified: true,
        };

        if (!tokenInfo.id) tokenInfo.id = NATIVE_TOKEN_ID;
        if (!tokenInfo.name) tokenInfo.name = nativeToken.symbol;

        if (network.ecosystem === Ecosystem.COSMOS) {
            tokenInfo.address = nativeToken.base;
            tokenInfo.base = nativeToken.base;
        }

        if (tokenInfo.name && !tokenInfo.name.includes('Native Token')) tokenInfo.name += ' Native Token';

        tokenInfo.price = getPriceFromConfig(network.ecosystem, network.net);

        // If there is no token in the list, add it
        if (!tokenFromList) {
            allTokens.push(tokenInfo);
            return allTokens;
        }

        // If there is a token in the list, update it
        if (tokenFromList) return allTokens.filter(({ id }) => id !== NATIVE_TOKEN_ID).concat(tokenInfo);

        // If there is no token in the list and no native token, return the list of tokens
        return allTokens;
    };

    const getAllTokensList = async (
        network: IChainConfig | null,
        fromToken: IAsset | null,
        toToken: IAsset | null,
        {
            onlyWithBalance = false,
            exclude = [],
        }: {
            onlyWithBalance?: boolean;
            exclude?: string[];
        } = {},
    ) => {
        // !if there is no network, return empty array
        if (!network) return [];

        const allTokens = ref<IAsset[]>([]);

        const { net, ecosystem } = network || {};
        const account = getAccount(ecosystem);

        // Get tokens with balance
        const tokensWithBalance = getTokensWithBalance(net, ecosystem, account as string);

        // Get tokens list from network
        const tokensListFromNet = await getTokensFromConfig(net);

        // Get verified tokens map
        const verifiedTokenMap = await getVerifiedTokensMap({ tokens: tokensListFromNet });

        // Validate tokens with balance to check if they are verified
        const tokensWithBalanceVerified = verifiedTokenMap
            ? validateVerifiedTokens(tokensWithBalance, verifiedTokenMap)
            : tokensWithBalance;

        // Target tokens list with or without balance
        if (onlyWithBalance && account) allTokens.value = tokensWithBalanceVerified;
        else allTokens.value = unionBy(tokensWithBalanceVerified, tokensListFromNet, (tkn) => tkn.address?.toLowerCase());

        const nativeToken = network.native_token || network.asset;
        const nativeTokenId = `${net}:tokens__native:${nativeToken?.symbol}`;

        // Set native token info
        if (!allTokens.value.find((tkn) => tkn.id === nativeTokenId)) allTokens.value = setNativeTokenInfo(network, allTokens.value);

        // *********************************************************
        // * Exclude tokens
        // *********************************************************
        if (exclude.length)
            allTokens.value = allTokens.value.filter(
                (tkn: IAsset) => !exclude.includes(tkn.id) && !exclude.includes(tkn.coingecko_id as string),
            );

        // *********************************************************
        // * Selected tokens
        // *********************************************************
        if (fromToken || toToken)
            for (const tkn of allTokens.value) {
                if (network.ecosystem === Ecosystem.COSMOS && tkn.address && !tkn.base) tkn.base = tkn.address;

                // Set Verified for Native Token
                if (tkn.id === nativeTokenId) tkn.verified = true;

                // Set Verified for other tokens
                if (tkn.address) tkn.verified = verifiedTokenMap.has(tkn?.address?.toLowerCase() || NATIVE_CONTRACT) || false;

                // Set selected tokens
                tkn.selected = fromToken?.id === tkn.id || toToken?.id === tkn.id;
            }

        // *********************************************************
        // * Sorting
        // by selected, native token, balance, verified
        // *********************************************************
        const sortedList = orderBy(
            allTokens.value,

            [
                // Sorting by selected
                (tkn) => tkn.selected,

                // Sorting by Native Token
                (tkn) => tkn?.id?.includes('tokens__native'),

                // Sorting by balance
                (tkn) => Number(tkn.balanceUsd),

                // Sorting by verified
                (tkn) => tkn.verified,

                // Sorting by whether the symbol starts with a letter (true) or not (false)
                (tkn) => /^[a-zA-Z]/.test(tkn.symbol as string),

                // Sorting by token symbol alphabetically
                (tkn) => tkn.symbol?.toLowerCase(),
            ],
            ['desc', 'desc', 'desc', 'desc', 'desc', 'asc'],
        );

        return sortedList;
    };

    const getTokensList = async ({
        srcNet = null,
        srcToken = null,
        dstToken = null,
        onlyWithBalance = false,
        exclude = [],
    }: {
        srcNet?: IChainConfig | null;
        srcToken?: IAsset | null;
        dstToken?: IAsset | null;
        onlyWithBalance?: boolean;
        exclude?: string[];
    } = {}): Promise<IAsset[]> => {
        try {
            return await getAllTokensList(srcNet, srcToken, dstToken, { onlyWithBalance, exclude });
        } catch (error) {
            console.error('getTokensList', error);
            return [];
        }
    };

    const getTokenById = async (network: IChainConfig, tokenId: string): Promise<IAsset | undefined> => {
        try {
            const tokens = await getTokensList({
                srcNet: network,
                onlyWithBalance: false,
            });

            return find(tokens, (token) => token.id.toLowerCase() === tokenId.toLowerCase());
        } catch (error) {
            console.error('getTokenById', error);
            return undefined;
        }
    };

    return {
        getAccount,

        getVerifiedTokensFromConfig,
        getVerifiedTokensMap,

        getTokensFromConfig,
        getTokensWithBalance,

        getPriceFromConfig,
        setNativeTokenInfo,

        getAllTokensList,

        getTokensList,

        getTokenById,
    };
}
