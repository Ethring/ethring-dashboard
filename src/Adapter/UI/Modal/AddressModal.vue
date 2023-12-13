<template>
    <a-modal
        v-model:open="isOpen"
        :title="$t('adapter.accountModalTitle')"
        centered
        :footer="null"
        :bodyStyle="{ height: '374px', overflowY: 'overlay' }"
    >
        <template #closeIcon> <CloseIcon /> </template>
        <ChainWithAddress v-if="addressesWithChains" :chainWithAddress="addressesWithChains" :chainRecords="chainRecords" />
    </a-modal>
</template>
<script>
import { ref, computed, onUpdated } from 'vue';
import { useStore } from 'vuex';

import useAdapter from '@/Adapter/compositions/useAdapter';

import ChainWithAddress from '@/Adapter/UI/Entities/ChainWithAddress';

import CloseIcon from '@/assets/icons/app/close.svg';

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

        onUpdated(() => {
            addressesWithChains.value = getAddressesWithChainsByEcosystem(ecosystem.value);
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
<style lang="scss">
.ant-modal {
    width: 588px !important;

    .ant-modal-content,
    .ant-modal-header {
        color: var(--#{$prefix}primary-text);
        background-color: var(--#{$prefix}secondary-background);
    }

    .ant-modal-content {
        border-radius: 16px;
    }

    .ant-modal-title {
        border-bottom: 1px dashed var(--#{$prefix}border-color);
        padding-bottom: 10px;
        margin-bottom: 24px;
        font-size: var(--#{$prefix}h3-fs);
        font-weight: 500;
    }

    .ant-modal-title,
    .ant-modal-close-x {
        color: var(--#{$prefix}primary-text);
    }

    .ant-modal-close {
        margin-top: 10px;
        &:hover {
            background: none !important;
        }
    }
}
</style>
