<template>
    <div class="search-input" :class="isActive">
        <div class="search-input__logo">
            <SearchIcon />
        </div>
        <div class="search-input__container">
            <input
                v-model="text"
                v-debounce:3s="() => $emit('onChange', text)"
                :placeholder="placeholder || $t('tokenOperations.searchToken')"
                @focus="isActive = 'active'"
                @blur="isActive = ''"
            />
        </div>
        <div v-if="text.length" class="search-input__clear" @click="clearValue">
            <ClearIcon class="input-clear-icon" />
        </div>
    </div>
</template>

<script>
import { ref, watch } from 'vue';

import SearchIcon from '@/assets/icons/form-icons/search.svg';
import ClearIcon from '@/assets/icons/form-icons/clear.svg';

export default {
    name: 'SearchInput',
    components: {
        SearchIcon,
        ClearIcon,
    },
    props: {
        value: {
            type: String,
            default: '',
        },
        placeholder: {
            type: String,
            default: '',
        },
    },
    emits: ['onChange', 'onClear'],
    setup(props, { emit }) {
        const text = ref(props.value || '');
        const isActive = ref('');

        const clearValue = () => {
            text.value = '';

            emit('onClear', text.value);
        };

        watch(
            () => text.value,
            () => {
                emit('onChange', text.value);
            },
        );

        watch(
            () => props.value,
            () => {
                text.value = props.value;
            },
        );

        return {
            text,
            isActive,
            clearValue,
        };
    },
};
</script>

<style lang="scss" scoped>
.search-input {
    position: relative;
    transition: all 0.2s;
    @include pageFlexRow;

    height: 48px;

    padding: 12px 8px;

    border: 1px solid var(--#{$prefix}select-border-color);
    border-radius: 8px;

    background: var(--#{$prefix}select-bg-color);

    &__container {
        width: 100%;
    }

    &__logo {
        @include pageFlexRow;
        justify-content: center;
        margin-right: 4px;

        svg {
            fill: var(--#{$prefix}select-placeholder-text);
        }
    }

    &__clear {
        position: absolute;
        right: 8px;

        top: 0;
        bottom: 0;
        margin: auto 0;

        cursor: pointer;
        @include pageFlexRow;
        justify-content: center;
    }

    input {
        width: 100%;

        font-style: normal;
        font-weight: 400;
        font-size: var(--#{$prefix}default-fs);

        color: var(--#{$prefix}select-placeholder-text);

        background-color: transparent;
        outline: none;
        border: none;
    }
}

.active {
    background: var(--#{$prefix}main-background);
    border: 1px solid var(--#{$prefix}sub-text);

    input {
        color: var(--#{$prefix}primary-text);
    }
}
</style>
