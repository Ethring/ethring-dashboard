import { computed } from 'vue';
import { useStore } from 'vuex';
import useWeb3Onboard from './useWeb3Onboard';

import { chainIds } from '@/config/availableNets';

export default function useTokens() {
    const store = useStore();

    const tokensBalance = computed(() => store.getters['tokens/tokens']);

    const zometNetworks = computed(() => store.getters['networks/zometNetworks']);
    
    const { currentChainInfo } = useWeb3Onboard();

    const groupTokensBalance = computed(() => store.getters['tokens/groupTokens']);

    const allTokensFromNetwork = (net) => {
        return zometNetworks.value[net]
            ? Object.keys(zometNetworks.value[net].tokens)
                  .map((tokenNet) => {
                      return zometNetworks.value[net].tokens[tokenNet];
                  })
                  .map((token) => ({
                      ...token,
                      balance: 0,
                      balanceUsd: 0,
                      code: token.symbol,
                  }))
                  .sort((a, b) => {
                      if (a.name > b.name) {
                          return 1;
                      }
                      if (a.name < b.name) {
                          return -1;
                      }
                      return 0;
                  })
            : [];
    };

    // all networks
    const groupTokens = computed(() => {
        if (currentChainInfo.value?.net && groupTokensBalance.value) {
            const groupList = [];
            Object.keys(groupTokensBalance.value)?.forEach((parentNet) => {
                let children = [];

                const tokens = groupTokensBalance.value[parentNet]?.list;

                if (tokens && tokens.length > 0) {
                    children = sortByBalanceUsd(tokens?.filter((item) => item.balance > 0) ?? []);
                }
                const nativeToken = tokens.find((elem) => elem.chain.toLowerCase() === parentNet);
                groupList.push({
                    priority: currentChainInfo.value?.net === parentNet ? 1 : 0,
                    net: parentNet,
                    name: parentNet,
                    ...zometNetworks.value[parentNet],
                    balance: nativeToken?.balance || 0,
                    latest_price: nativeToken?.latest_price || 0,
                    list: children,
                    totalSumUSD: children?.reduce((acc, item) => acc + +item.balanceUsd, 0) ?? 0,
                    chain_id: chainIds[parentNet],
                });
            });

            // show all without current network group
            const result = [
                ...groupList.filter((g) => g.net === currentChainInfo.value?.net),
                ...groupList.filter((g) => g.net !== currentChainInfo.value?.net),
            ].sort((prev, next) => next.totalSumUSD - prev.totalSumUSD);

            return result.sort((prev, next) => next.priority - prev.priority);
        }
        return [];
    });

    // single network
    const tokens = computed(() => {
        if (currentChainInfo.value?.net) {
            const tokens = zometNetworks.value[currentChainInfo.value?.net]?.tokens;

            if (tokens) {
                return sortByBalanceUsd(
                    Object.keys(tokens)
                        .map((item) => {
                            const balance = tokensBalance.value[tokens[item].net] || 0;
                            return {
                                ...tokens[item],
                                balance,
                            };
                        })
                        ?.filter((item) => item.balance > 0)
                );
            }
        }
        return [];
    });

    const getTokenList = (network) => {
        const listWithBalances = network?.list || [];
        return sortByBalanceUsd(listWithBalances);
    };

    const sortByBalanceUsd = (list) => {
        return list?.sort((a, b) => {
            if (a.balanceUsd > b.balanceUsd) {
                return -1;
            }
            if (a.balanceUsd < b.balanceUsd) {
                return 1;
            }
            return 0;
        });
    };
    return {
        tokens,
        groupTokens,
        allTokensFromNetwork,
        getTokenList,
        sortByBalanceUsd,
    };
}
