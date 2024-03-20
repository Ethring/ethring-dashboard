<template>
    <div class="shortcut-details">
        <div class="wallpaper" />

        <a-row align="center" justify="space-between" :wrap="false">
            <router-link to="/shortcuts" class="link">
                <ArrowIcon />
                <span>{{ $t('shortcuts.backTo') }}</span>
            </router-link>

            <div class="title" :title="shortcut.name">{{ shortcut.name }}</div>

            <Button title="Details" class="shortcut-details-btn" />
        </a-row>
        <div class="description">{{ shortcut.description }}</div>

        <a-row :gutter="16">
            <a-col :md="24" :lg="12"> Content </a-col>
            <a-col :md="24" :lg="12">
                <a-steps direction="vertical" v-model:current="currentStep" :items="steps"></a-steps>
            </a-col>
        </a-row>
    </div>
</template>

<script>
import { computed, ref, h } from 'vue';
import { useStore } from 'vuex';

import StepItem from './StepItem.vue';

import ArrowIcon from '@/assets/icons/form-icons/arrow-back.svg';
import SuccessIcon from '@/assets/icons/form-icons/success.svg';
import WaitingIcon from '@/assets/icons/form-icons/waiting.svg';
import ProcessIcon from '@/assets/icons/form-icons/process.svg';

export default {
    name: 'ShortcutDetails',
    components: {
        StepItem,
        ArrowIcon,
    },
    setup() {
        const store = useStore();

        const shortcut = computed(() => store.getters['shortcuts/selectedShortcut']);

        const currentStep = ref(1);

        const getStepIcon = (id) => {
            return currentStep.value === id ? h(ProcessIcon) : currentStep.value > id ? h(SuccessIcon) : h(WaitingIcon);
        };

        const steps = computed(() =>
            shortcut.value.recipe.operations?.map((item, i) => {
                return {
                    id: i,
                    title: h(StepItem, { data: item }),
                    icon: getStepIcon(i),
                };
            })
        );

        return {
            shortcut,
            steps,
            currentStep,
        };
    },
};
</script>
