import { computed } from "vue";
import { useStore } from "vuex";

export default function useConnect() {
  const store = useStore();

  const metamaskConnect = computed(
    () => store.getters["metamask/metamaskConnector"]
  );

  const hasConnect = computed(() => {
    return metamaskConnect.value.accounts?.length;
  });

  return {
    hasConnect,
  };
}
