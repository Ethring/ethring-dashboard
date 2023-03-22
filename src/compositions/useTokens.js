import { computed } from "vue";
import { useStore } from "vuex";
import useConnect from "@/compositions/useConnect";

export default function useTokens() {
  const store = useStore();
  const { activeConnect } = useConnect();

  const networks = computed(() => store.getters["networks/networks"]);
  const tokensBalance = computed(() => store.getters["tokens/tokens"]);
  const groupTokensBalance = computed(
    () => store.getters["tokens/groupTokens"]
  );

  // all networks
  const groupTokens = computed(() => {
    if (activeConnect.value.network) {
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
          net: parentNet,
          ...networks.value[parentNet],
          list: childs,
        });
      });

      // show all without current network group
      return groupList.filter(
        (group) =>
          group.net !== activeConnect.value.network && group.list.length
      );
    }
    return [];
  });

  // single network
  const tokens = computed(() => {
    if (activeConnect.value.network) {
      const tokens = networks.value[activeConnect.value.network]?.tokens;

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
    return [];
  });

  return {
    tokens,
    groupTokens,
  };
}
