import { computed } from 'vue';
import { useStore } from 'vuex';

import useAdapter from '@/Adapter/compositions/useAdapter';
import { ECOSYSTEMS } from '@/Adapter/config';

export default function useTokens() {
    const store = useStore();

    const { walletAccount, currentChainInfo } = useAdapter();

    if (!walletAccount.value) {
        return {
            tokens: [],
            groupTokens: [],
            allTokensFromNetwork: () => [],
            getTokenList: () => [],
        };
    }

    const zometNetworks = computed(() => store.getters['networks/zometNetworks']);

    const groupTokensBalance = computed(() => store.getters['tokens/groupTokens']);

    const sortByBalanceUsd = (list = []) => {
        return list.sort((a, b) => b.balanceUsd - a.balanceUsd);
    };

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
        const { net, ecosystem, asset = {} } = currentChainInfo.value || {};

        if (!net && !groupTokensBalance.value) {
            return [];
        }

        const groupList = [];

        let children = [];

        for (const network in groupTokensBalance.value) {
            const tokens = groupTokensBalance.value[network]?.list;

            const record = {
                priority: net === network ? 1 : 0,
                net: network,
                name: network,
            };

            if (tokens && tokens.length > 0) {
                children = sortByBalanceUsd(tokens?.filter((item) => item.balance > 0) ?? []);
                record.list = children;

                const nativeToken = tokens.find(({ chain }) => chain.toLowerCase() === network);

                record.balance = nativeToken?.balance || 0;
                record.latest_price = nativeToken?.latest_price || 0;

                // TODO: remove this after adding tokens to the cosmos network
                if (ecosystem === ECOSYSTEMS.COSMOS) {
                    const baseToken = tokens.find(({ code }) => code === asset.code);

                    const tokenInfo = {
                        ...asset,
                        ...baseToken,
                        balance: baseToken?.balance || 0,
                        balanceUsd: baseToken?.balanceUsd || 0,
                    };

                    record.list = [tokenInfo];
                }

                record.totalSumUSD = record.list?.reduce((acc, item) => acc + +item.balanceUsd, 0) ?? 0;

                groupList.push(record);
            }
        }

        // show all without current network group
        const result = [...groupList.filter((g) => g.net === net), ...groupList.filter((g) => g.net !== net)].sort(
            (prev, next) => next.totalSumUSD - prev.totalSumUSD
        );

        return result.sort((prev, next) => next.priority - prev.priority);
    });

    return {
        groupTokens,
        allTokensFromNetwork,
    };
}
