import { computed } from "vue";
import { useStore } from "vuex";

export default function useConnect() {
  const store = useStore();

  const metamaskConnect = computed(
    () => store.getters["metamask/metamaskConnector"]
  );

  const activeConnect = computed(() => metamaskConnect.value);

  const hasConnect = computed(() => {
    return activeConnect.value.accounts?.length;
  });

  return {
    hasConnect,
    activeConnect,
  };
}
