<template>
    <div class="shortcut-details">
        <a-row align="middle" justify="space-between" :wrap="false">
            <router-link to="/portfolio" class="link">
                <ArrowIcon />
                <span>{{ $t('portfolio.backTo') }}</span>
            </router-link>
        </a-row>

        <div class="wallpaper mt-16" :style="{ ...wallpaper }" />

        <a-divider />

        <div class="layout-page__content">
            <a-spin :spinning="isShortcutLoading" size="large">
                <a-row :gutter="[16, 16]">
                    <a-col :span="24" :lg="12">
                        <div v-if="shortcutLayout" class="steps-content">
                            <component
                                :is="shortcutLayout"
                                v-if="shortcutLayout"
                                :is-hide-actions="isShortcutLoading || shortcut?.isComingSoon"
                            />
                            <div v-if="shortcut?.isComingSoon" class="coming-soon">
                                <p class="coming-soon__title">{{ $t('shortcuts.comingSoon') }}</p>
                                <p class="coming-soon__description">{{ $t('shortcuts.comingSoonDescription') }}</p>
                                <UiButton title="Whitelist" :icon="LikeIcon" />
                            </div>
                        </div>

                        <ShortcutLoading v-if="isShowLoading" :shortcut-id="shortcutId" />
                    </a-col>
                    <a-col :span="24" :lg="12">
                        <a-steps v-model:current="shortcutIndex" direction="vertical" :items="steps" />
                    </a-col>
                </a-row>
            </a-spin>
        </div>
    </div>
    <SuccessShortcutModal />
</template>

<script lang="ts">
import { computed, onBeforeMount, ref } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';

import ArrowIcon from '@/assets/icons/form-icons/arrow-back.svg';
import LikeIcon from '@/assets/icons/dashboard/heart.svg';

import ShortcutPlaceholder from '@/assets/images/placeholder/shortcut.png';

import ShortcutLoading from '@/components/shortcuts/Loading/ShortcutLoading.vue';
import SuccessShortcutModal from '@/components/app/modals/SuccessShortcutModal.vue';

import useShortcuts from '@/core/shortcuts/compositions/index';

import { SHORTCUT_STATUSES, STATUSES } from '@/shared/models/enums/statuses.enum';
import { ShareAltOutlined } from '@ant-design/icons-vue';

export default {
    name: 'Withdraw',
    components: {
        ArrowIcon,
        LikeIcon,
        ShortcutLoading,
        SuccessShortcutModal,
        ShareAltOutlined,
    },
    setup() {
        const store = useStore();

        const route = useRoute();

        const shortcut = computed(() => store.getters['shortcutsList/selectedShortcut']);

        const { shortcutId, shortcutIndex, steps, shortcutLayout, shortcutStatus, isShortcutLoading } = useShortcuts(shortcut.value);

        const isShowLoading = computed(() => {
            if (isShortcutLoading.value) return false;

            if (!shortcut.value) return false;
            if (!shortcutStatus.value) return false;
            if (shortcutStatus.value === STATUSES.PENDING) return false;

            return [STATUSES.IN_PROGRESS, STATUSES.SUCCESS, STATUSES.FAILED].includes(shortcutStatus.value);
        });

        const wallpaper = computed(() => {
            return {
                backgroundImage: `url(https://zomet-shortcuts.s3.eu-central-1.amazonaws.com/withdraw.png)`,
            };
        });

        onBeforeMount(() => {
            if (route?.params?.id) store.dispatch('shortcutsList/loadShortcutById', route.params.id);
        });

        return {
            isShowLoading,
            shortcut,
            isShortcutLoading,
            shortcutId,
            shortcutStatus,
            shortcutIndex,
            steps,
            shortcutLayout,
            SHORTCUT_STATUSES,
            STATUSES,
            wallpaper,
            LikeIcon,
        };
    },
};
</script>
