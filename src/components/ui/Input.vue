<template>
    <a-form-item
        class="select-panel select-input"
        :class="{ active: active, focused, error: isError }"
        @click="active = true"
        v-click-away="(active = false)"
    >
        <div class="input-label">{{ label }}</div>

        <a-input-group compact class="input-group">
            <a-input
                allow-clear
                v-model:value="inputValue"
                class="base-input"
                data-qa="custom-input"
                :bordered="false"
                :placeholder="placeholder"
                v-debounce:1s="onInput"
                @focus="focused = true"
                @blur="onBlur"
            >
                <template #clearIcon>
                    <ClearIcon class="input-clear-icon" />
                </template>
            </a-input>
        </a-input-group>
    </a-form-item>
</template>

<script>
import ClearIcon from '@/assets/icons/form-icons/clear.svg';

import { ref, watch, computed } from 'vue';

export default {
    name: 'Input',
    props: {
        value: {
            type: String,
            default: '',
        },
        label: {
            type: String,
            default: '',
        },
        placeholder: {
            type: String,
            default: '',
        },
        onReset: {
            type: [Boolean, String],
            default: false,
        },
    },
    components: {
        ClearIcon,
    },
    setup(props, { emit }) {
        const inputValue = ref('');

        const active = ref(false);
        const focused = ref(false);

        const resetFields = computed(() => props.onReset);

        const resetValue = () => {
            if (!resetFields.value) {
                return;
            }
            inputValue.value = '';
            active.value = false;
        };

        const onInput = () => (active.value = false);

        const onBlur = () => {
            emit('setValue', inputValue.value);
            focused.value = false;
        };

        // =================================================================================================================

        watch(
            () => props.onReset,
            () => resetValue()
        );

        return {
            active,
            focused,
            inputValue,

            onInput,
            onBlur,
        };
    },
};
</script>

<style lang="scss" scoped>
.select-input {
    min-height: 80px;
    height: 80px;

    .base-input {
        padding: 0;
    }
}
</style>