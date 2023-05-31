import { computed } from 'vue';
import { useStore } from 'vuex';
import useWeb3Onboard from './useWeb3Onboard';

export default function useTokens() {
    const store = useStore();

    const networks = computed(() => store.getters['networks/networks']);
    const tokensBalance = computed(() => store.getters['tokens/tokens']);

    const { currentChainInfo } = useWeb3Onboard();

    const groupTokensBalance = computed(() => store.getters['tokens/groupTokens']);

    const allTokensFromNetwork = (net) =>
        Object.keys(networks.value[net].tokens)
            .map((tokenNet) => {
                return networks.value[net].tokens[tokenNet];
            })
            .map((token) => ({
                ...token,
                balance: {
                    amount: 0,
                    price: {
                        BTC: 0,
                        USD: 0,
                    },
                },
                balanceUsd: 0,
                price: {
                    BTC: 0,
                    USD: 0,
                },
            }))
            .sort((a, b) => {
                if (a.name > b.name) {
                    return 1;
                }
                if (a.name < b.name) {
                    return -1;
                }
                return 0;
            });

    // all networks
    const groupTokens = computed(() => {
        if (currentChainInfo.value?.citadelNet) {
            const groupList = [];

            Object.keys(groupTokensBalance.value).forEach((parentNet) => {
                const tokens = groupTokensBalance.value[parentNet].list;
                const parentTokens = networks.value[parentNet].tokens;

                const childs = Object.keys(tokens)
                    .map((item) => {
                        const balance = tokens[item];

                        return {
                            ...tokens[item],
                            ...parentTokens[item],
                            balance,
                            balanceUsd: balance.amount * balance.price.USD,
                        };
                    })
                    .filter((item) => item.balance.amount > 0)
                    .sort((a, b) => {
                        if (a.balanceUsd > b.balanceUsd) {
                            return 1;
                        }
                        if (a.balanceUsd < b.balanceUsd) {
                            return 0;
                        }
                        return -1;
                    });

                groupList.push({
                    priority: currentChainInfo.value?.citadelNet === parentNet ? 1 : 0,
                    net: parentNet,
                    ...networks.value[parentNet],
                    balance: groupTokensBalance.value[parentNet]?.balance,
                    balanceUsd: groupTokensBalance.value[parentNet]?.balanceUsd,
                    price: groupTokensBalance.value[parentNet]?.price,
                    list: childs,
                });
            });

            // show all without current network group
            return [
                ...groupList.filter((g) => g.net === currentChainInfo.value?.citadelNet),
                ...groupList.filter((g) => g.net !== currentChainInfo.value?.citadelNet),
            ];
            // .filter(() => group.net !== currentChainInfo.value?.citadelNet && group.list.length
        }
        return [];
    });

    // single network
    const tokens = computed(() => {
        if (currentChainInfo.value?.citadelNet) {
            const tokens = networks.value[currentChainInfo.value?.citadelNet]?.tokens;

            if (tokens) {
                return Object.keys(tokens)
                    .map((item) => {
                        const balance = tokensBalance.value[tokens[item].net] || {
                            amount: 0,
                            price: {
                                BTC: 0,
                                USD: 0,
                            },
                        };
                        return {
                            ...tokens[item],
                            balance,
                            balanceUsd: balance.amount * balance.price.USD,
                        };
                    })
                    .filter((item) => item.balance.amount > 0)
                    .sort((a, b) => {
                        if (a.balanceUsd > b.balanceUsd) {
                            return 1;
                        }
                        if (a.balanceUsd < b.balanceUsd) {
                            return 0;
                        }
                        return -1;
                    });
            }
        }
        return [];
    });

    return {
        tokens,
        groupTokens,
        allTokensFromNetwork,
    };
}
