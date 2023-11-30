<template>
    <div class="search-input" :class="isActive">
        <div class="search-input__logo">
            <SearchIcon />
        </div>
        <div class="search-input__container">
            <input
                @focus="isActive = 'active'"
                @blur="isActive = ''"
                v-model="text"
                :placeholder="placeholder || $t('tokenOperations.searchToken')"
            />
        </div>
        <div v-if="text.length" class="search-input__clear" @click="clearValue">
            <ClearIcon />
        </div>
    </div>
</template>

<script>
import { ref, watch } from 'vue';

import SearchIcon from '@/assets/icons/app/search.svg';
import ClearIcon from '@/assets/icons/app/xmark.svg';

export default {
    name: 'SearchInput',
    components: {
        SearchIcon,
        ClearIcon,
    },
    props: {
        value: {
            default: '',
        },
        placeholder: {
            default: '',
        },
    },
    setup(props, { emit }) {
        const text = ref(props.value || '');
        const isActive = ref('');

        const clearValue = () => {
            text.value = '';
        };

        watch(text, (val) => {
            emit('onChange', val);
        });

        watch(
            () => props.value,
            () => {
                text.value = props.value;
            }
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

    @include pageFlexRow;

    height: 40px;

    padding: 12px 8px;

    border: 1px solid var(--#{$prefix}select-bg-color);
    border-radius: 8px;

    background: var(--#{$prefix}select-bg-color);

    &__container {
        width: 100%;
    }

    span {
        display: block;

        font-style: normal;
        font-weight: 400;
        font-size: var(--#{$prefix}small-lg-fs);
        color: var(--#{$prefix}base-text);
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
