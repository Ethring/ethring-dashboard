import { computed } from 'vue';

import { useStore } from 'vuex';

import { Ecosystems, Ecosystem } from '@/shared/models/enums/ecosystems.enum';

export default function usePoolList() {
    const store = useStore();

    const getAccount = (ecosystem: Ecosystems): string | null => store?.getters['adapters/getAccountByEcosystem'](ecosystem);

    const accountByEcosystem = computed(() => getAccount(Ecosystem.EVM));

    const pools = computed(() => store?.getters['tokens/getPoolsByAccount'](accountByEcosystem.value, 'pools') || []);

    return pools;
}
