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

            <a-dropdown
                v-if="shortcut.id === AvailableShortcuts.Debridge && deBridgeInfo && deBridgeInfo.points"
                :arrow="{ pointAtCenter: true }"
                placement="bottom"
                class="shortcut-details__points-block"
            >
                <p class="shortcut-details__points">
                    {{ Math.round(deBridgeInfo.points.s2?.totalPoints) || 0 }} points
                    <span class="shortcut-details__points-tag">{{ deBridgeInfo.multiplier }}x</span>
                </p>
                <template #overlay>
                    <a-menu class="shortcut-details__points-overlay">
                        <p>{{ $t('shortcuts.points') }}:</p>
                        <a-radio-group v-model:value="activeOption" button-style="solid" class="slippage__control-options">
                            <a-row :wrap="false">
                                <a-radio-button value="s2">Season 2</a-radio-button>
                                <a-radio-button value="s1">Season 1 <span class="ended-tag">Ended</span></a-radio-button>
                            </a-row>
                        </a-radio-group>
                        <p>Points: {{ Math.round(deBridgeInfo.points[activeOption]?.totalPoints) || 0 }}</p>
                        <p v-if="deBridgeInfo.points[activeOption]?.userRank">
                            Rank: {{ Math.round(deBridgeInfo.points[activeOption].userRank) }}
                        </p>
                        <hr />
                        <p>
                            Multiplier: <span class="shortcut-details__points-tag">{{ deBridgeInfo.multiplier }}x</span>
                        </p>
                    </a-menu>
                </template>
            </a-dropdown>
        </div>

        <a-divider />

        <div class="layout-page__content">
            <a-spin :spinning="isShortcutLoading" size="large">
                <a-row :gutter="[16, 16]">
                    <a-col :md="24" :lg="12">
                        <div class="steps-content">
                            <component :is="shortcutLayout" :is-hide-actions="isShortcutLoading || shortcut?.isComingSoon" />

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
import { isEmpty } from 'lodash';

import { computed, onMounted, watch, ref } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';

import ArrowIcon from '@/assets/icons/form-icons/arrow-back.svg';
import LikeIcon from '@/assets/icons/dashboard/heart.svg';

import ShortcutPlaceholder from '@/assets/images/placeholder/shortcut.png';

import UiButton from '@/components/ui/Button.vue';
import ShortcutLoading from '@/components/shortcuts/Loading/ShortcutLoading.vue';
import SuccessShortcutModal from '@/components/app/modals/SuccessShortcutModal.vue';

import useShortcuts from '@/core/shortcuts/compositions/index';

import { SHORTCUT_STATUSES, STATUSES } from '@/shared/models/enums/statuses.enum';
import { AvailableShortcuts } from '@/core/shortcuts/data/shortcuts.ts';

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
        const { walletAddress } = useAdapter();

        const activeOption = ref('s1');
        const shortcut = computed(() => store.getters['shortcutsList/getShortcutById'](route.params.id));

        const { shortcutId, shortcutIndex, steps, shortcutLayout, shortcutStatus, isShortcutLoading } = useShortcuts(shortcut.value);

        const isShowLoading = computed(() => {
            if (isShortcutLoading.value) return false;

            if (!shortcut.value) return false;
            if (!shortcutStatus.value) return false;
            if (shortcutStatus.value === STATUSES.PENDING) return false;

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

        const deBridgeInfo = computed(() => store.getters['shortcuts/getDeBridgeInfo'](walletAddress.value));

        onMounted(() => {
            if (isEmpty(shortcut.value)) return router.push('/shortcuts');
        });

        watch(shortcutStatus, (newVal) => {
            if (newVal === STATUSES.SUCCESS) store.dispatch('app/toggleModal', 'successShortcutModal');
        });

        return {
            activeOption,
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
            deBridgeInfo,
            AvailableShortcuts,
        };
    },
};
</script>
