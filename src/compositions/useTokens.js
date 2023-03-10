import { computed } from "vue";
import { useStore } from "vuex";

export default function useTokens() {
  const store = useStore();

  const metamaskConnect = computed(
    () => store.getters["metamask/metamaskConnector"]
  );

  const networks = computed(() => store.getters["networks/networks"]);
  const tokensBalance = computed(() => store.getters["tokens/tokens"]);

  const tokens = computed(() => {
    if (metamaskConnect.value.network) {
      const tokens = networks.value[metamaskConnect.value.network].tokens;

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
  };
}
