<template>
    <a-form-item
        v-click-away="(active = false)"
        class="select-panel select-input"
        :class="{ active: active, focused, disabled }"
        @click="active = true"
    >
        <div class="input-label">{{ $t('tokenOperations.memoLabel') }}</div>

        <a-input-group compact class="input-group">
            <a-input
                v-model:value="memo"
                v-debounce:1s="onInput"
                allow-clear
                class="base-input"
                data-qa="custom-input"
                :bordered="false"
                :disabled="disabled"
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
