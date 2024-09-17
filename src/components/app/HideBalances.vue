<template>
    <a-input-number
        v-model:value="inputValue"
        class="hide-balances"
        prefix="Hide: < $"
        :controls="false"
        :min="0"
        @input="handleOnChange"
        @blur="handleSave"
        @mouseleave="handleSave"
        @keydown.enter="handleSave"
    />
</template>

<script>
import { ref, computed, watch, onUnmounted } from 'vue';
import { useStore } from 'vuex';

import { formatInputNumber } from '@/shared/utils/input';

export default {
    name: 'HideBalances',
    setup() {
        const store = useStore();

        const minBalance = computed({
            get: () => store.getters['tokens/minBalance'],
            set: (value) => store.dispatch('tokens/setMinBalance', value),
        });

        const inputValue = ref(minBalance.value);

        const handleOnChange = (value = '') => {
            if (!value) return (inputValue.value = 0);
            inputValue.value = formatInputNumber(value);
        };

        const handleSave = () => {
            if (inputValue.value === minBalance.value) return;
            minBalance.value = inputValue.value;
        };

        const unWatch = watch(inputValue, (value) => handleOnChange(value));

        onUnmounted(() => unWatch());

        return {
            inputValue,

            handleSave,
            handleOnChange,
        };
    },
};
</script>
