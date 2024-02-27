<template>
    <a-form-item
        class="select-panel select-input"
        :class="{ active: active, focused, disabled }"
        @click="active = true"
        v-click-away="(active = false)"
    >
        <div class="input-label">{{ $t('tokenOperations.memoLabel') }}</div>

        <a-input-group compact class="input-group">
            <a-input
                allow-clear
                v-model:value="memo"
                class="base-input"
                data-qa="custom-input"
                :bordered="false"
                :disabled="disabled"
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
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

import ClearIcon from '@/assets/icons/form-icons/clear.svg';

export default {
    name: 'MemoInput',
    components: {
        ClearIcon,
    },
    props: {
        disabled: {
            type: Boolean,
            default: false,
        },
    },
    setup() {
        const store = useStore();

        const memo = computed({
            get: () => store.getters['tokenOps/memo'],
            set: (value) => store.dispatch('tokenOps/setMemo', value),
        });

        const active = ref(false);
        const focused = ref(false);

        const onInput = () => (active.value = false);

        const onBlur = () => {
            focused.value = false;
        };

        return {
            active,
            focused,
            memo,

            onInput,
            onBlur,
        };
    },
};
</script>

<style lang="scss" scoped>
.select-input {
    min-height: 80px;

    .base-input {
        padding: 0;
    }
}
</style>
