import { computed } from 'vue';

import { useStore } from 'vuex';
import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';

export default function usePoolList() {
    const store = useStore();

    const { walletAccount } = useAdapter();

    const pools = computed(() => store.getters['tokens/getPoolsByAccount'](walletAccount.value, 'pools') || []);

    return pools;
}
