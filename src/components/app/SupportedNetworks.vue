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

            <!-- <a-row justify="start">
                <Checkbox v-model:value="isSelectAll" label="Select all" />
            </a-row> -->

            <div class="networks-list">
                <div
                    v-for="network in activeOption.networks"
                    :key="network.net"
                    class="networks-list__item"
                    :class="{ disabled: !network.isSupportedChain }"
                >
                    <TokenIcon width="36" height="36" :token="network" class="logo" />
                    <div class="name" :title="network?.name">{{ network.name }}</div>
                    <div v-if="!network.isSupportedChain" class="soon">soon</div>
                </div>
            </div>
        </a-modal>
    </div>
</template>

<script>
import { ref, watch } from 'vue';

import { useStore } from 'vuex';
import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';

import SelectRecord from '@/components/ui/Select/SelectRecord';
import Checkbox from '@/components/ui/Checkbox';
import TokenIcon from '@/components/ui/Tokens/TokenIcon';

import ArrowUpIcon from '@/assets/icons/module-icons/pointer-up.svg';

import { Ecosystem } from '@/shared/models/enums/ecosystems.enum';

export default {
    name: 'SupportedNetworks',
    components: {
        SelectRecord,
        TokenIcon,
        ArrowUpIcon,
    },
    setup() {
        const store = useStore();

        const isModalOpen = ref(false);
        // const isSelectAll = ref(true);

        const { getChainListByEcosystem } = useAdapter();

        const supportedEcosystems = [
            {
                name: 'EVM',
                networks: getChainListByEcosystem(Ecosystem.EVM, true),
            },
            {
                name: 'Cosmos',
                networks: getChainListByEcosystem(Ecosystem.COSMOS, true),
            },
        ];

        const activeOption = ref(supportedEcosystems[0]);

        // const handleOnClickNetwork = async (network) => {
        //     if (!network.isSupportedChain) return;

        //     await store.dispatch('tokens/setNetworksToShow', {
        //         network: network.net,
        //         isShow: !getShowStatus(network),
        //     });
        // };

        const getShowStatus = (network) => {
            if (!network.isSupportedChain) return false;
            if (!store.getters['tokens/networksToShow']) return false;
            return store.getters['tokens/networksToShow'][network.net];
        };

        // const handleONClickSelectAll = () => {
        //     const networks = store.getters['tokens/networksToShow'];

        //     if (!isSelectAll.value) {
        //         for (const network in networks)
        //             store.dispatch('tokens/setNetworksToShow', {
        //                 network,
        //                 isShow: false,
        //             });

        //         return;
        //     }

        //     for (const network in networks)
        //         store.dispatch('tokens/setNetworksToShow', {
        //             network,
        //             isShow: true,
        //         });
        // };

        // watch(isSelectAll, () => handleONClickSelectAll());

        return {
            // isSelectAll,
            isModalOpen,
            activeOption,

            supportedEcosystems,

            getShowStatus,
            // handleOnClickNetwork,
            // handleONClickSelectAll,
        };
    },
};
</script>
