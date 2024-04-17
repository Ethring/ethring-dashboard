<template>
    <a-form-item
        class="select-panel select-input"
        :class="{ active: active, focused, disabled }"
        @click="active = true"
        v-click-away="(active = false)"
    >
        <div class="input-label">To Mint ({{ contractCallCount || 0 }} / {{ max }})</div>

        <a-input-group compact class="input-group">
            <a-input-number
                :controls="false"
                allow-clear
                v-model:value="contractCallCount"
                class="base-input mint-count-input"
                data-qa="custom-input"
                :min="1"
                :max="max"
                :bordered="false"
                :disabled="disabled"
                v-debounce:1s="onInput"
                @focus="focused = true"
                @blur="onBlur"
            >
                <template #clearIcon>
                    <ClearIcon class="input-clear-icon" />
                </template>
            </a-input-number>
        </a-input-group>
    </a-form-item>
</template>

<script>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

import ClearIcon from '@/assets/icons/form-icons/clear.svg';

export default {
    name: 'CountInput',
    components: {
        ClearIcon,
    },
    props: {
        disabled: {
            type: Boolean,
            default: false,
        },
        max: {
            type: Number,
            default: 1,
        },
    },
    setup() {
        const store = useStore();

        const contractCallCount = computed({
            get: () => store.getters['tokenOps/contractCallCount'],
            set: (value) => store.dispatch('tokenOps/setContractCallCount', value),
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
            contractCallCount,

            onInput,
            onBlur,
        };
    },
};
</script>

<style lang="scss" scoped>
.select-input {
    min-height: 64px;
    max-height: 64px;

    .input-label {
        font-size: var(--#{$prefix}small-sm-fs);
    }
    .input-group {
        min-height: 30px !important;
    }
    .base-input {
        padding: 0;
    }
}
</style>
