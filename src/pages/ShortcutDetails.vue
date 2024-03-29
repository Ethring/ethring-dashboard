<template>
    <div class="shortcut-details">
        <div class="wallpaper" />

        <a-row align="center" justify="space-between" :wrap="false">
            <router-link to="/shortcuts" class="link">
                <ArrowIcon />
                <span>{{ $t('shortcuts.backTo') }}</span>
            </router-link>

            <div class="title" :title="shortcut?.name || ''">{{ shortcut?.name || '' }}</div>

            <Button title="Details" class="shortcut-details-btn" disabled />
        </a-row>

        <div class="description" v-if="shortcut && shortcut.description">{{ shortcut.description }}</div>

        <div class="layout-page__content">
            <a-spin :spinning="isShortcutLoading" size="large">
                <a-row :gutter="16">
                    <a-col :span="12">
                        <div class="steps-content">
                            <component :is="shortcutLayout" />
                        </div>

                        <ShortcutLoading
                            v-if="
                                shortcutId !== null &&
                                [STATUSES.IN_PROGRESS, STATUSES.SUCCESS, STATUSES.FAILED].includes(shortcutStatus) &&
                                shortcutStatus !== STATUSES.PENDING
                            "
                            :status="shortcutStatus"
                            :shortcutIndex="shortcutIndex"
                            :shortcutId="shortcutId"
                            :total="steps.length || 0"
                        />
                    </a-col>
                    <a-col :span="12">
                        <a-steps direction="vertical" v-model:current="shortcutIndex" :items="steps" />
                    </a-col>
                </a-row>
            </a-spin>
        </div>
    </div>
</template>

<script>
import _ from 'lodash';

import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';

import ArrowIcon from '@/assets/icons/form-icons/arrow-back.svg';

import ShortcutLoading from '@/components/shortcuts/Loading/ShortcutLoading.vue';

import useShortcuts from '@/modules/shortcuts/compositions/index';

import { SHORTCUT_STATUSES, STATUSES } from '@/shared/models/enums/statuses.enum';

export default {
    name: 'ShortcutDetails',
    components: {
        ArrowIcon,
        ShortcutLoading,
    },
    setup() {
        const store = useStore();

        const router = useRouter();
        const route = useRoute();

        const shortcut = computed(() => store.getters['shortcutsList/getShortcutById'](route.params.id));

        const { shortcutId, shortcutIndex, steps, shortcutLayout, shortcutStatus, isShortcutLoading } = useShortcuts(shortcut.value);

        onMounted(() => {
            if (_.isEmpty(shortcut.value)) {
                return router.push('/shortcuts');
            }
        });

        return {
            shortcut,
            isShortcutLoading,
            shortcutId,
            shortcutStatus,
            shortcutIndex,
            steps,
            shortcutLayout,
            SHORTCUT_STATUSES,
            STATUSES,
        };
    },
};
</script>
<style lang="scss" scoped>
.layout-page__content {
    margin-top: 80px;
}
</style>
