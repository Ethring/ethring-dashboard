<template>
    <a-modal
        v-model:open="isOpen"
        :title="$t('adapter.accountModalTitle')"
        centered
        :footer="null"
        :body-style="{ height: '374px', overflowY: 'overlay' }"
    >
        <template #closeIcon> <CloseIcon /> </template>
        <ChainWithAddress v-if="addressesWithChains" :chain-with-address="addressesWithChains" :chain-records="chainRecords" />
    </a-modal>
</template>
<script>
import { ref, computed, onUpdated } from 'vue';
import { useStore } from 'vuex';

import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';

import ChainWithAddress from '@/core/wallet-adapter/UI/Entities/ChainWithAddress';

import CloseIcon from '@/assets/icons/form-icons/close.svg';

export default {
    name: 'AddressModal',
    components: {
        ChainWithAddress,
        CloseIcon,
    },
    setup() {
        const store = useStore();

        const isOpen = computed({
            get: () => store.getters['adapters/isOpen']('addresses'),
            set: (value) => store.dispatch('adapters/SET_MODAL_STATE', { name: 'addresses', isOpen: value }),
        });

        const ecosystem = computed(() => store.getters['adapters/getModalEcosystem']);

        const { getAddressesWithChainsByEcosystem, getChainListByEcosystem } = useAdapter();

        const addressesWithChains = ref([]);
        const chainRecords = ref([]);

        onUpdated(async () => {
            addressesWithChains.value = await getAddressesWithChainsByEcosystem(ecosystem.value);
            chainRecords.value = getChainListByEcosystem(ecosystem.value);
        });

        return {
            isOpen,
            addressesWithChains,

            chainRecords,
            ecosystem,
        };
    },
};
</script>
