<template>
    <a-modal
        v-model:open="isOpen"
        :title="$t('adapter.accountModalTitle')"
        centered
        :footer="null"
        width="720px"
        :bodyStyle="{ height: '500px', overflowY: 'overlay' }"
    >
        <ChainWithAddress v-if="addressesWithChains" :chainWithAddress="addressesWithChains" :chainList="chainList" />
    </a-modal>
</template>
<script>
import { ref, computed, onUpdated } from 'vue';
import { useStore } from 'vuex';

import useAdapter from '@/Adapter/compositions/useAdapter';

import ChainWithAddress from '@/Adapter/UI/Entities/ChainWithAddress';

import { ECOSYSTEMS } from '@/Adapter/config';

export default {
    name: 'AddressModal',
    components: {
        ChainWithAddress,
    },
    setup() {
        const store = useStore();

        const isOpen = computed({
            get: () => store.getters['adapters/isOpen']('addresses'),
            set: (value) => store.dispatch('adapters/SET_MODAL_STATE', { name: 'addresses', isOpen: value }),
        });

        const ecosystem = computed(() => store.getters['adapters/getModalEcosystem']);

        const { getAddressesWithChainsByEcosystem, getChainListByEcosystem, connectedWallets } = useAdapter();

        const chainList = ref([]);
        const addressesWithChains = ref([]);

        onUpdated(() => {
            addressesWithChains.value = getAddressesWithChainsByEcosystem(ecosystem.value);

            if (ecosystem.value === ECOSYSTEMS.EVM) {
                const connectedEVMWallets = connectedWallets.value.filter((wallet) => wallet.ecosystem === ECOSYSTEMS.EVM);
                const chainListByEcosystem = getChainListByEcosystem(ecosystem.value);

                const matchingChains = chainListByEcosystem.filter((selectedChain) =>
                    connectedEVMWallets.some((wallet) => wallet.chain === selectedChain.chain_id)
                );

                chainList.value = matchingChains;
            } else {
                chainList.value = getChainListByEcosystem(ecosystem.value);
            }
        });

        return {
            isOpen,
            addressesWithChains,
            chainList,
            ecosystem,
        };
    },
};
</script>
<style lang="scss">
.ant-modal {
    .ant-modal-content,
    .ant-modal-header {
        color: var(--#{$prefix}primary-text);
        background-color: var(--#{$prefix}secondary-background);
    }

    .ant-modal-title,
    .ant-modal-close-x {
        color: var(--#{$prefix}primary-text);
    }
}
</style>
