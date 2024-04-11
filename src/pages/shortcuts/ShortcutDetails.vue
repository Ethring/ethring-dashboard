<template>
    <div class="shortcut-details">
        <div class="wallpaper" :style="{ ...wallpaper }" />

        <a-row align="middle" justify="space-between" :wrap="false">
            <router-link to="/shortcuts" class="link">
                <ArrowIcon />
                <span>{{ $t('shortcuts.backTo') }}</span>
            </router-link>

            <div class="title" :title="shortcut?.name || ''">{{ shortcut?.name || '' }}</div>

            <Button title="Details" class="shortcut-details-btn" disabled />
        </a-row>

        <div class="description" v-if="shortcut && (shortcut.description || shortcut.minUsdAmount)">
            <p v-if="shortcut.description">{{ shortcut.description }}</p>

            <p v-if="shortcut.minUsdAmount && shortcut.minUsdAmount > 0">
                {{ $t('shortcuts.minUsdAmount') }}: ${{ shortcut.minUsdAmount }}
            </p>
        </div>

        <a-divider />

        <div class="layout-page__content">
            <a-spin :spinning="isShortcutLoading" size="large">
                <a-row :gutter="16">
                    <a-col :span="12">
                        <div class="steps-content">
                            <component :is="shortcutLayout" />
                        </div>

                        <ShortcutLoading v-show="isShowLoading" :shortcutId="shortcutId" />
                    </a-col>
                    <a-col :span="12">
                        <a-steps direction="vertical" v-model:current="shortcutIndex" :items="steps" />
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

import ShortcutPlaceholder from '@/assets/images/placeholder/shortcut.png';

import ShortcutLoading from '@/components/shortcuts/Loading/ShortcutLoading.vue';
import SuccessShortcutModal from '@/components/app/modals/SuccessShortcutModal.vue';

import useShortcuts from '@/modules/shortcuts/compositions/index';

import { SHORTCUT_STATUSES, STATUSES } from '@/shared/models/enums/statuses.enum';

export default {
    name: 'ShortcutDetails',
    components: {
        ArrowIcon,
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
            if (shortcut.value && !shortcut.value.wallpaper) {
                return {
                    backgroundImage: `url(${ShortcutPlaceholder})`,
                };
            }

            return {
                backgroundImage: `url(${shortcut.value.wallpaper})`,
            };
        });

        onMounted(() => {
            if (_.isEmpty(shortcut.value)) {
                return router.push('/shortcuts');
            }
        });

        watch(shortcutStatus, (newVal) => {
            if (newVal === STATUSES.SUCCESS) {
                store.dispatch('app/toggleModal', 'successShortcutModal');
            }
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
        };
    },
};
</script>
