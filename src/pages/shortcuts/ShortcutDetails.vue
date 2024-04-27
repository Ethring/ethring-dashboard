<template>
    <div class="shortcut-details">
        <div class="wallpaper" :style="{ ...wallpaper }" />

        <a-row align="middle" justify="space-between" :wrap="false">
            <router-link to="/shortcuts" class="link">
                <ArrowIcon />
                <span>{{ $t('shortcuts.backTo') }}</span>
            </router-link>

            <div class="title" :title="shortcut?.name || ''">{{ shortcut?.name || '' }}</div>

            <UiButton title="Details" class="shortcut-details-btn" disabled />
        </a-row>

        <div v-if="shortcut && (shortcut.description || shortcut.minUsdAmount)" class="description">
            <p v-if="shortcut.description">{{ shortcut.description }}</p>

            <p v-if="shortcut.minUsdAmount && shortcut.minUsdAmount > 0">
                {{ $t('shortcuts.minUsdAmount') }}: ${{ shortcut.minUsdAmount }}
            </p>
        </div>

        <a-divider />

        <div class="layout-page__content">
            <a-spin :spinning="isShortcutLoading" size="large">
                <a-row :gutter="[16, 16]">
                    <a-col :md="24" :lg="12">
                        <div class="steps-content">
                            <component :is="shortcutLayout" />

                            <div v-if="shortcut?.isComingSoon" class="coming-soon">
                                <p class="coming-soon__title">{{ $t('shortcuts.comingSoon') }}</p>
                                <p class="coming-soon__description">{{ $t('shortcuts.comingSoonDescription') }}</p>
                                <UiButton title="Whitelist" :icon="LikeIcon" />
                            </div>
                        </div>

                        <ShortcutLoading v-if="isShowLoading" :shortcut-id="shortcutId" />
                    </a-col>
                    <a-col :md="24" :lg="12">
                        <a-steps v-model:current="shortcutIndex" direction="vertical" :items="steps" />
                    </a-col>
                </a-row>
            </a-spin>
        </div>
    </div>
    <SuccessShortcutModal />
</template>

<script lang="ts">
import _ from 'lodash';

import { computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';

import ArrowIcon from '@/assets/icons/form-icons/arrow-back.svg';
import LikeIcon from '@/assets/icons/dashboard/heart.svg';

import ShortcutPlaceholder from '@/assets/images/placeholder/shortcut.png';

import UiButton from '@/components/ui/Button.vue';
import ShortcutLoading from '@/components/shortcuts/Loading/ShortcutLoading.vue';
import SuccessShortcutModal from '@/components/app/modals/SuccessShortcutModal.vue';

import useShortcuts from '@/core/shortcuts/compositions/index';

import { SHORTCUT_STATUSES, STATUSES } from '@/shared/models/enums/statuses.enum';

export default {
    name: 'ShortcutDetails',
    components: {
        ArrowIcon,
        LikeIcon,
        UiButton,
        ShortcutLoading,
        SuccessShortcutModal,
    },
    setup() {
        const store = useStore();

        const router = useRouter();
        const route = useRoute();

        const shortcut = computed(() => store.getters['shortcutsList/getShortcutById'](route.params.id));

        const { shortcutId, shortcutIndex, steps, shortcutLayout, shortcutStatus, isShortcutLoading } = useShortcuts(shortcut.value);

        const isShowLoading = computed(() => {
            if (isShortcutLoading.value) return false;

            if (!shortcut.value) return false;
            if (!shortcutStatus.value) return false;
            if (shortcutStatus.value === STATUSES.PENDING) return false;

            console.log('-'.repeat(50));
            console.log('shortcutStatus.value', shortcutStatus.value);
            console.log('STATUSES', [STATUSES.IN_PROGRESS, STATUSES.SUCCESS, STATUSES.FAILED].includes(shortcutStatus.value));
            console.log('-'.repeat(50));

            return [STATUSES.IN_PROGRESS, STATUSES.SUCCESS, STATUSES.FAILED].includes(shortcutStatus.value);
        });

        const wallpaper = computed(() => {
            if (shortcut.value && !shortcut.value.wallpaper)
                return {
                    backgroundImage: `url(${ShortcutPlaceholder})`,
                };

            return {
                backgroundImage: `url(${shortcut.value.wallpaper})`,
            };
        });

        onMounted(() => {
            if (_.isEmpty(shortcut.value)) return router.push('/shortcuts');
        });

        watch(shortcutStatus, (newVal) => {
            if (newVal === STATUSES.SUCCESS) store.dispatch('app/toggleModal', 'successShortcutModal');
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
