<template>
    <div class="supported-networks" data-qa="supported-networks">
        <SelectRecord :current="{ name: $t('dashboard.allNetworks') }" is-all-networks @click="isModalOpen = true" />

        <a-modal
            v-model:open="isModalOpen"
            centered
            :footer="null"
            :title="$t('dashboard.supportedNetworks')"
            class="supported-networks__modal"
        >
            <a-row class="networks-tab">
                <div
                    v-for="item in supportedEcosystems"
                    :key="item.name"
                    :class="{ 'networks-tab__active': activeOption.name === item.name }"
                    @click="activeOption = item"
                >
                    {{ item.name }}
                    <ArrowUpIcon class="arrow" />
                </div>
            </a-row>

            <div class="networks-list">
                <div
                    v-for="network in activeOption.networks"
                    :key="network.net"
                    class="networks-list__item"
                    :class="{ disabled: !network.isSupportedChain }"
                >
                    <TokenIcon width="36" height="36" :token="network" class="logo" />
                    <div class="name">{{ network.name }}</div>
                    <div v-if="!network.isSupportedChain" class="soon">soon</div>
                </div>
            </div>
        </a-modal>
    </div>
</template>

<script>
import { ref, inject } from 'vue';

import SelectRecord from '@/components/ui/Select/SelectRecord';
import TokenIcon from '@/components/ui/Tokens/TokenIcon';

import ArrowUpIcon from '@/assets/icons/module-icons/pointer-up.svg';

import { ECOSYSTEMS } from '@/core/wallet-adapter/config';

export default {
    name: 'SupportedNetworks',
    components: {
        SelectRecord,
        TokenIcon,
        ArrowUpIcon,
    },
    setup() {
        const useAdapter = inject('useAdapter');
        const { getChainListByEcosystem } = useAdapter();

        const supportedEcosystems = [
            {
                name: 'EVM',
                networks: getChainListByEcosystem(ECOSYSTEMS.EVM),
            },
            {
                name: 'Cosmos',
                networks: getChainListByEcosystem(ECOSYSTEMS.COSMOS, true),
            },
        ];

        const isModalOpen = ref(false);
        const activeOption = ref(supportedEcosystems[0]);

        return {
            isModalOpen,
            activeOption,

            supportedEcosystems,
        };
    },
};
</script>
