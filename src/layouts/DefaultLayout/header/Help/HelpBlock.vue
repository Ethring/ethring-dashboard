<template>
    <div class="help">
        <a-tooltip placement="bottom">
            <template #title> {{ $t('dashboard.switchTheme') }} </template>
            <ThemeSwitcher />
        </a-tooltip>

        <HelpItem tooltipText="dashboard.releaseNotes" @click="showReleaseNotes" :badge="showBadge">
            <FileDoneOutlined />
        </HelpItem>

        <template v-if="currentChainInfo">
            <HelpItem tooltipText="dashboard.buyCrypto" @click="toggleBuyCryptoModal">
                <BuyCryptoIcon />
            </HelpItem>

            <HelpItem :tooltipText="tooltipText" :disabled="true">
                <SyncOutlined />
            </HelpItem>
        </template>
    </div>
</template>
<script>
import { computed, inject } from 'vue';
import { useStore } from 'vuex';

import { FileDoneOutlined, SyncOutlined } from '@ant-design/icons-vue';
import BuyCryptoIcon from '@/assets/icons/sidebar/buy-crypto.svg';
import ThemeSwitcher from '../ThemeSwitcher.vue';

import HelpItem from './HelpItem.vue';

export default {
    name: 'HelpBlock',
    components: {
        HelpItem,
        ThemeSwitcher,
        BuyCryptoIcon,
        FileDoneOutlined,
        SyncOutlined,
    },
    setup() {
        const store = useStore();
        const useAdapter = inject('useAdapter');

        const { currentChainInfo } = useAdapter();

        const showReleaseNotes = () => store.dispatch('app/toggleReleaseNotes');

        const isLoading = computed(() => store.getters['tokens/loader'] || false);

        const lastVersion = computed(() => store.getters['app/lastVersion']);

        const tooltipText = computed(() => (isLoading.value ? 'dashboard.updatingBalances' : 'dashboard.updateBalances'));

        const handleReload = () => {
            window.location.reload(true);
        };

        const showBadge = computed(() => {
            if (process.env.VUE_APP_VERSION !== lastVersion.value) {
                return 1;
            }

            return 0;
        });

        const toggleBuyCryptoModal = () => store.dispatch('app/toggleModal', 'buyCrypto');

        return {
            isLoading,
            tooltipText,
            currentChainInfo,
            showBadge,

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
