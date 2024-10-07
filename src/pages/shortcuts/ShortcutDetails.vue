<template>
    <div v-if="shortcut?.error">
        <a-empty class="shortcut-not-found">
            <template #description>
                <span>{{ shortcut.error }}</span>
            </template>
        </a-empty>
    </div>
    <div v-else class="shortcut-details">
        <div class="wallpaper" :style="{ ...wallpaper }" />

        <a-row align="middle" justify="space-between" :wrap="false">
            <router-link to="/shortcuts" class="link">
                <ArrowIcon />
                <span>{{ $t('shortcuts.backTo') }}</span>
            </router-link>

            <div class="title" :title="shortcut?.name || ''">{{ shortcut?.name || '' }}</div>

            <UiButton title="Details" class="shortcut-details-btn" disabled />
            <UiButton :title="$t('shortcuts.share')" class="shortcut-details-btn" @click="openShareModal" />
        </a-row>

        <div v-if="shortcut && (shortcut.description || shortcut.minUsdAmount)" class="description">
            <p v-if="shortcut.description">{{ shortcut.description }}</p>

            <p v-if="shortcut.minUsdAmount && shortcut.minUsdAmount > 0">
                {{ $t('shortcuts.minUsdAmount') }}: ${{ shortcut.minUsdAmount }}
            </p>

            <p
                v-if="metaInfo[shortcut.callShortcutMethod] && shortcut.callShortcutMethod === 'loadMitosisPoints'"
                class="shortcut-details__points"
            >
                Linea: {{ Math.round(metaInfo[shortcut.callShortcutMethod].linea?.xp) || 0 }} points
            </p>

            <a-dropdown
                v-if="metaInfo[shortcut.callShortcutMethod] && shortcut.callShortcutMethod === 'loadMantlePoints'"
                :arrow="{ pointAtCenter: true }"
                placement="bottom"
                class="shortcut-details__points-block"
            >
                <p class="shortcut-details__points">Points: {{ Math.round(metaInfo[shortcut.callShortcutMethod]?.totalPoints) || 0 }}</p>
                <template #overlay>
                    <a-menu class="shortcut-details__points-overlay">
                        <p v-if="metaInfo[shortcut.callShortcutMethod]?.rank">Rank: {{ metaInfo[shortcut.callShortcutMethod]?.rank }}</p>
                        <hr v-if="metaInfo[shortcut.callShortcutMethod]?.rank" />
                        <p>L1 points: {{ Math.round(metaInfo[shortcut.callShortcutMethod]?.l1Points) || 0 }}</p>
                        <p>L2 points: {{ Math.round(metaInfo[shortcut.callShortcutMethod]?.l2Points) || 0 }}</p>
                        <hr />
                        <p>Token points: {{ Math.round(metaInfo[shortcut.callShortcutMethod]?.tokenPoints) || 0 }}</p>
                        <p>Referral points: {{ Math.round(metaInfo[shortcut.callShortcutMethod]?.referralPoints) || 0 }}</p>
                    </a-menu>
                </template>
            </a-dropdown>
            <a-dropdown
                v-if="metaInfo[shortcut.callShortcutMethod] && shortcut.callShortcutMethod === 'loadDebridgeInfo'"
                :arrow="{ pointAtCenter: true }"
                placement="bottom"
                class="shortcut-details__points-block"
            >
                <p class="shortcut-details__points">
                    {{ Math.round(metaInfo[shortcut.callShortcutMethod].points.s2?.totalPoints) || 0 }} points
                    <span class="shortcut-details__points-tag">{{ metaInfo[shortcut.callShortcutMethod].multiplier }}x</span>
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
                        <p>Points: {{ Math.round(metaInfo[shortcut.callShortcutMethod].points[activeOption]?.totalPoints) || 0 }}</p>
                        <p v-if="metaInfo[shortcut.callShortcutMethod].points[activeOption]?.userRank">
                            Rank: {{ Math.round(metaInfo[shortcut.callShortcutMethod].points[activeOption].userRank) }}
                        </p>
                        <hr />
                        <p>
                            Multiplier:
                            <span class="shortcut-details__points-tag">{{ metaInfo[shortcut.callShortcutMethod].multiplier }}x</span>
                        </p>
                    </a-menu>
                </template>
            </a-dropdown>
        </div>

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
    <SocialShare />
</template>

<script lang="ts">
import { computed, onBeforeMount, ref } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';

import ArrowIcon from '@/assets/icons/form-icons/arrow-back.svg';
import LikeIcon from '@/assets/icons/dashboard/heart.svg';

import ShortcutPlaceholder from '@/assets/images/placeholder/shortcut.png';

import UiButton from '@/components/ui/Button.vue';
import ShortcutLoading from '@/components/shortcuts/Loading/ShortcutLoading.vue';
import SuccessShortcutModal from '@/components/app/modals/SuccessShortcutModal.vue';

import useShortcuts from '@/core/shortcuts/compositions/index';

import { SHORTCUT_STATUSES, STATUSES } from '@/shared/models/enums/statuses.enum';
import { ShareAltOutlined } from '@ant-design/icons-vue';
import SocialShare from '@/components/ui/SocialShare/SocialShare.vue';

export default {
    name: 'ShortcutDetails',
    components: {
        ArrowIcon,
        LikeIcon,
        UiButton,
        ShortcutLoading,
        SuccessShortcutModal,
        SocialShare,
        ShareAltOutlined,
    },
    setup() {
        const store = useStore();

        const route = useRoute();

        const activeOption = ref('s1');
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
            if (shortcut.value && shortcut.value.wallpaper)
                return {
                    backgroundImage: `url(${shortcut.value.wallpaper})`,
                };

            return {
                backgroundImage: `url(${ShortcutPlaceholder})`,
            };
        });

        const metaInfo = computed(() => store.getters['shortcuts/getShortcutMetaInfo']);

        onBeforeMount(() => {
            if (route?.params?.id) store.dispatch('shortcutsList/loadShortcutById', route.params.id);
        });

        const openShareModal = () => {
            store.dispatch('app/toggleModal', 'socialShare');
        };

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
            metaInfo,
            openShareModal,
        };
    },
};
</script>
