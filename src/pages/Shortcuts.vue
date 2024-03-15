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
                        <component :is="steps[shortcutIndex]?.content" />
                    </div>
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
import _ from 'lodash';

import { ref, computed, watch, h, onMounted, onBeforeMount } from 'vue';
import { useStore } from 'vuex';

import Button from '@/components/ui/Button.vue';
import RecipeStake from '@/modules/shortcuts/data/citadel-stake.json';

import useAdapter from '@/Adapter/compositions/useAdapter';
import useTokensList from '@/compositions/useTokensList';

export default {
    name: 'Shortcuts',

    components: {
        Button,
    },

    setup() {
        const { getChainByChainId } = useAdapter();
        const { getTokenById } = useTokensList();

        const store = useStore();

        const shortcutIndex = computed({
            get: () => store.getters['shortcuts/getShortcutIndex'],
            set: (value) => store.dispatch('shortcuts/setShortcutIndex', { index: value }),
        });

        const isConfigLoading = computed(() => store.getters['configs/isConfigLoading']);

        const steps = computed(() => store.getters['shortcuts/getShortcutSteps'](RecipeStake?.id));

        const currentOp = computed(() => store.getters['shortcuts/getCurrentOperation'](RecipeStake.id));

        const performFields = async (params) => {
            const { moduleType } = currentOp.value || {};

            for (const param of params) {
                const {
                    name: field,
                    ecosystem = null,
                    chainId = null,
                    chain = null,
                    disabled = false,
                    id = null,
                    address,
                    memo,
                } = param || {};

                switch (field) {
                    case 'srcNetwork':
                    case 'dstNetwork':
                        const srcDstNet = getChainByChainId(ecosystem, chainId);
                        await store.dispatch(`tokenOps/setFieldValue`, { field, value: srcDstNet });
                        break;
                    case 'srcToken':
                    case 'dstToken':
                        const tokenNet = getChainByChainId(ecosystem, chain);
                        const token = await getTokenById(tokenNet, id);
                        await store.dispatch(`tokenOps/setFieldValue`, { field, value: token });
                        break;
                    case 'receiverAddress':
                        await store.dispatch(`tokenOps/setFieldValue`, { field, value: address });
                        break;
                    case 'memo':
                        await store.dispatch(`tokenOps/setFieldValue`, { field, value: memo });
                        break;
                }

                store.dispatch('moduleStates/setDisabledField', {
                    module: moduleType,
                    field,
                    props: 'disabled',
                    value: disabled,
                });
            }
        };

        const performSkipConditions = async (skipConditions = []) => {
            for (const condition of skipConditions) {
                const { name: field, value } = condition || {};
                const fieldValue = store.getters['tokenOps/getFieldValue'](field);

                switch (field) {
                    case 'srcNetwork':
                    case 'dstNetwork':
                        const isSkipNet = fieldValue && fieldValue.net === value;
                        isSkipNet &&
                            store.dispatch('shortcuts/setShortcutStepStatus', {
                                shortcutId: RecipeStake.id,
                                stepId: steps.value[shortcutIndex.value].id,
                                status: 'skipped',
                            });

                        shortcutIndex.value = isSkipNet ? shortcutIndex.value + 1 : shortcutIndex.value;

                    case 'srcToken':
                    case 'dstToken':
                        const isSkipToken = fieldValue && fieldValue.id === value;
                        isSkipToken &&
                            store.dispatch('shortcuts/setShortcutStepStatus', {
                                shortcutId: RecipeStake.id,
                                stepId: steps.value[shortcutIndex.value].id,
                                status: 'skipped',
                            });
                        shortcutIndex.value = isSkipToken ? shortcutIndex.value + 1 : shortcutIndex.value;
                }
            }
        };

        const callOnWatchOnMounted = async () => {
            await store.dispatch('tokenOps/resetFields');

            const { params = [], skipConditions = [] } = currentOp.value || {};
            await performSkipConditions(skipConditions);
            return await performFields(params);
        };

        watch([currentOp, isConfigLoading], async () => await callOnWatchOnMounted());

        onBeforeMount(async () => {
            await store.dispatch('shortcuts/setShortcut', {
                shortcut: RecipeStake.id,
                data: RecipeStake.recipe,
            });
        });

        onMounted(async () => {
            shortcutIndex.value = 0;

            store.dispatch('shortcuts/setCurrentStepId', {
                stepId: steps.value[shortcutIndex.value].id,
                shortcutId: RecipeStake.id,
            });

            store.dispatch('shortcuts/setCurrentShortcutId', {
                shortcutId: RecipeStake.id,
            });

            await callOnWatchOnMounted();
        });

        store.subscribe((mutation) => {
            const { type } = mutation || {};

            if (!_.startsWith(type, 'tokenOps')) return;
            if (_.isEqual(type, 'tokenOps/RESET_ALL_FIELDS')) return;

            const { skipConditions = [] } = currentOp.value || {};

            performSkipConditions(skipConditions);
        });

        watch(shortcutIndex, async () => {
            await store.dispatch('tokenOps/resetFields');

            await store.dispatch('shortcuts/setCurrentStepId', {
                shortcutId: RecipeStake.id,
                stepId: steps.value[shortcutIndex.value].id,
            });
        });

        return {
            shortcut: RecipeStake,
            shortcutIndex,
            steps,
        };
    },
};
</script>

<style lang="scss" scoped>
.layout-page__content {
    margin-top: 80px;
}
.steps-content {
    // position: relative;
}
</style>
