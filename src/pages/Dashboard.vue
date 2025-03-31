<template>
    <div class="dashboard" data-qa="dashboard">
        <template v-if="!walletAccount">
            <ConnectWalletAdapter />
        </template>
        <template v-else>
            <div class="dashboard__wallet">
                <WalletInfoLarge />
            </div>

            <a-row class="dashboard__options" justify="space-between">
                <a-col>
                    <a-tabs v-model:activeKey="activeTab" class="dashboard__tabs" @change="handelOnTabChange">
                        <a-tab-pane key="portfolio">
                            <template #tab>
                                <span @click="() => handelOnTabChange('portfolio')"> {{ $t('dashboard.tabs.portfolio') }} </span>
                            </template>
                        </a-tab-pane>
                        <a-tab-pane v-if="connectedWallet.ecosystem === ECOSYSTEMS.COSMOS" key="nfts">
                            <template #tab>
                                <span> {{ $t('dashboard.tabs.nfts') }} </span>
                            </template>
                        </a-tab-pane>
                    </a-tabs>
                </a-col>

                <a-col>
                    <a-row :gutter="8">
                        <a-col>
                            <HideBalances />
                        </a-col>
                        <a-col>
                            <SupportedNetworks />
                        </a-col>
                    </a-row>
                </a-col>
            </a-row>
            <router-view v-slot="{ Component }">
                <keep-alive max="2">
                    <component :is="Component" />
                </keep-alive>
            </router-view>
        </template>
    </div>
</template>

<script>
import { computed, onMounted, onActivated, onUnmounted } from 'vue';

import ConnectWalletAdapter from '@/components/app/ConnectWalletAdapter.vue';
import WalletInfoLarge from '@/components/app/WalletInfoLarge.vue';

import SupportedNetworks from '@/components/app/SupportedNetworks.vue';
import HideBalances from '@/components/app/HideBalances.vue';
import { useRouter } from 'vue-router';
import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';
import { useStore } from 'vuex';
import { ECOSYSTEMS } from '@/core/wallet-adapter/config';

export default {
    name: 'Dashboard',
    components: {
        WalletInfoLarge,
        ConnectWalletAdapter,
        SupportedNetworks,
        HideBalances,
    },
    setup() {
        const router = useRouter();
        const store = useStore();

        const activeTab = computed({
            get: () => store.getters['tokens/activeTab'],
            set: () => store.dispatch('tokens/setActiveTab'),
        });

        const { walletAccount, connectedWallet } = useAdapter();

        const handelOnTabChange = (key) => {
            store.dispatch('tokens/resetIndexes');
            router.push({ path: `/main/${key}` });
        };

        onActivated(() => {
            const { path } = router.currentRoute.value;
            if (path.includes('nfts')) activeTab.value = 'nfts';
            else activeTab.value = 'portfolio';
        });

        onMounted(() => {
            const { path } = router.currentRoute.value;
            if (path.includes('nfts')) activeTab.value = 'nfts';
            else activeTab.value = 'portfolio';
        });

        onUnmounted(() => {
            activeTab.value = 'portfolio';
        });

        return {
            activeTab,
            walletAccount,
            connectedWallet,
            ECOSYSTEMS,

            handelOnTabChange,
        };
    },
};
</script>
<style lang="scss" scoped>
.dashboard {
    &__wallet {
        margin-bottom: 24px;
    }

    &__controls {
        @include pageFlexRow;
        z-index: 1;
    }
}
</style>
