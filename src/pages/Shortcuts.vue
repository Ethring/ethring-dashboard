<template>
    <div class="layout-page">
        <div>
            <a-typography-title :level="3">
                {{ shortcut.name }}
            </a-typography-title>

            <a-typography-paragraph>
                {{ shortcut.description }}
            </a-typography-paragraph>
        </div>
        <a-divider />
        <div class="layout-page__content">
            <a-row :gutter="16">
                <a-col :span="12">
                    <div class="steps-content">
                        <component :is="shortcutLayout" />
                    </div>

                    <ShortcutLoading :status="shortcutStatus" />
                </a-col>
                <a-col :span="12">
                    <a-card>
                        <a-steps v-model:current="shortcutIndex" direction="vertical" size="small" :items="steps" />
                    </a-card>
                </a-col>
            </a-row>
        </div>
    </div>
</template>
<script>
import Button from '@/components/ui/Button.vue';
import ShortcutLoading from '@/components/ui/Loadings/ShortcutLoading.vue';

import RecipeStake from '@/modules/shortcuts/data/citadel-stake.json';

import useShortcuts from '../modules/shortcuts/compositions/index';

import { SHORTCUT_STATUSES } from '../shared/models/enums/statuses.enum';

export default {
    name: 'Shortcuts',

    components: {
        Button,
        ShortcutLoading,
    },

    setup() {
        const { shortcutIndex, steps, shortcutLayout, shortcutStatus } = useShortcuts(RecipeStake);

        return {
            shortcutStatus,
            shortcut: RecipeStake,
            shortcutIndex,
            steps,
            shortcutLayout,
            SHORTCUT_STATUSES,
        };
    },
};
</script>

<style lang="scss" scoped>
.layout-page__content {
    margin-top: 80px;
}
</style>
