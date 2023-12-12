<template>
    <div class="help">
        <ThemeSwitcher class="head__switcher" />

        <div class="help__item">
            <FileDoneOutlined @click="showModal" />

            <a-modal v-model:open="open" title="Update available" centered :footer="null">
                <p>
                    {{ $t('dashboard.updateAvailable') }}
                </p>
                <div class="release-list">
                    <div v-for="item in releaseNotes" :key="item" class="release-item" v-html="item" />
                </div>
                <Button title="Update" class="update-modal" @click="handleReload" />
            </a-modal>
        </div>

        <div class="help__item" :class="{ disabled: true }" v-if="currentChainInfo">
            <a-tooltip>
                <template #title> {{ $t(tooltipText) }} </template>
                <SyncOutlined :spin="isLoading" />
            </a-tooltip>
        </div>
    </div>
</template>
<script>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

import useAdapter from '@/Adapter/compositions/useAdapter';

import { FileDoneOutlined, SyncOutlined } from '@ant-design/icons-vue';

import ThemeSwitcher from '@/components/app/ThemeSwitcher';
import Button from '@/components/ui/Button';

import { RELEASE_NOTES } from '@/config/releaseNotes';

export default {
    name: 'Help',
    components: {
        ThemeSwitcher,
        Button,
        FileDoneOutlined,
        SyncOutlined,
    },
    setup() {
        const store = useStore();
        const { currentChainInfo } = useAdapter();

        const open = ref(false);

        const showModal = () => {
            open.value = true;
        };

        const isLoading = computed(() => store.getters['tokens/loader'] || false);

        const tooltipText = computed(() => (isLoading.value ? 'dashboard.updatingBalances' : 'dashboard.updateBalances'));

        const handleReload = () => {
            window.location.reload(true);
        };

        return {
            open,
            releaseNotes: RELEASE_NOTES,
            isLoading,
            tooltipText,
            currentChainInfo,

            handleReload,
            showModal,
        };
    },
};
</script>
<style lang="scss" scoped>
.help {
    @include pageFlexRow;

    &__item {
        width: 32px;
        height: 32px;
        border-radius: 50%;

        @include pageFlexRow;
        justify-content: center;

        background: var(--#{$prefix}icon-secondary-bg-color);
        color: var(--#{$prefix}icon-active);

        font-weight: 400;
        font-size: var(--#{$prefix}h3-fs);

        margin-left: 10px;

        cursor: pointer;

        &:hover:not(.disabled) {
            background: var(--#{$prefix}icon-active);
            color: var(--#{$prefix}icon-secondary-bg-color);
        }

        span {
            font-size: var(--#{$prefix}h4-fs);
        }

        svg {
            fill: var(--#{$prefix}icon-active);
        }

        &.disabled {
            cursor: not-allowed;
            opacity: 0.5;

            svg {
                fill: var(--#{$prefix}icon-secondary-bg-color);
            }
        }
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

.update-modal {
    margin: 10px auto;
    width: 100%;
}
</style>
