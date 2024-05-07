<template>
    <div class="help">
        <a-tooltip placement="bottom">
            <template #title> {{ $t('dashboard.switchTheme') }} </template>
            <ThemeSwitcher />
        </a-tooltip>

        <HelpItem tooltipText="dashboard.releaseNotes" @click="showReleaseNotes" :badge="showBadge">
            <ReleaseNoteIcon />
        </HelpItem>

        <template v-if="currentChainInfo">
            <HelpItem tooltip-text="dashboard.buyCrypto" @click="toggleBuyCryptoModal">
                <BuyCryptoIcon />
            </HelpItem>

            <HelpItem :tooltip-text="tooltipText" :disabled="isLoading" @click="loadBalances">
                <SyncOutlined :spin="isLoading" />
            </HelpItem>
        </template>
    </div>
</template>
<script>
import { computed, inject } from 'vue';
import { useStore } from 'vuex';

import _ from 'lodash';

import { SyncOutlined } from '@ant-design/icons-vue';

import ReleaseNoteIcon from '@/assets/icons/platform-icons/note.svg';
import BuyCryptoIcon from '@/assets/icons/sidebar/buy-crypto.svg';

import ThemeSwitcher from '../ThemeSwitcher.vue';
import HelpItem from './HelpItem.vue';

import { updateBalanceForAccount } from '@/core/balance-provider';

import { DP_CHAINS } from '@/core/balance-provider/models/enums';

export default {
    name: 'HelpBlock',
    components: {
        HelpItem,
        ThemeSwitcher,
        BuyCryptoIcon,
        SyncOutlined,
        ReleaseNoteIcon,
    },
    setup() {
        const store = useStore();
        const useAdapter = inject('useAdapter');

        const { currentChainInfo, connectedWallets } = useAdapter();

        const showReleaseNotes = () => store.dispatch('app/toggleReleaseNotes');

        const isLoading = computed(() => store.getters['tokens/loader'] || false);

        const lastVersion = computed(() => store.getters['app/lastVersion']);

        const tooltipText = computed(() => (isLoading.value ? 'dashboard.updatingBalances' : 'dashboard.updateBalances'));

        const handleReload = () => {
            window.location.reload(true);
        };

        const showBadge = computed(() => {
            if (process.env.APP_VERSION !== lastVersion.value) return 1;

            return 0;
        });

        const toggleBuyCryptoModal = () => store.dispatch('app/toggleModal', 'buyCrypto');

        const loadBalances = async () => {
            if (isLoading.value) return;

            for (const { account, addresses } of connectedWallets.value) {
                store.dispatch('tokens/setIsInitCall', { account, time: null });

                const list = _.pick(addresses, Object.values(DP_CHAINS)) || {};

                await updateBalanceForAccount(account, list);
            }
        };

        return {
            isLoading,
            tooltipText,
            currentChainInfo,
            showBadge,

            loadBalances,
            handleReload,
            toggleBuyCryptoModal,
            showReleaseNotes,
        };
    },
};
</script>
<style lang="scss" scoped>
.help {
    @include pageFlexRow;
    max-height: 32px !important;

    & > div:not(:last-child) {
        margin-right: 10px;
    }
}

.release-list {
    background: var(--#{$prefix}secondary-background);

    .release-item {
        padding: 4px 0;
        color: var(--#{$prefix}mute-text);

        &:not(:last-child) {
            border-bottom: 1px solid var(--zmt-border-color-op-05);
        }
    }
}
</style>
