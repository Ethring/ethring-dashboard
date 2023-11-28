<template>
    <div class="search-input" :class="isActive">
        <div class="search-input__logo">
            <SearchIcon />
        </div>
        <div class="search-input__container">
            <span>{{ $t('dashboard.search') }}</span>
            <input @focus="isActive = 'active'" @blur="isActive = ''" v-model="text" :placeholder="$t('tokenOperations.searchToken')" />
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
    setup(props, { emit }) {
        const text = ref(props.value || '');
        const isActive = ref('');

        const clearValue = () => {
            text.value = '';
        };

        watch(text, (val) => {
            emit('onChange', val);
        });

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

    height: 72px;

    padding: 16px;

    border: 1px solid var(--#{$prefix}white);
    border-radius: 8px;

    background: var(--#{$prefix}select-bg-color);

    &__container {
        width: 100%;
    }

    span {
        display: block;

        font-style: normal;
        font-weight: 500;
        font-size: var(--#{$prefix}small-lg-fs);
        color: var(--#{$prefix}base-text);
    }

    &__logo {
        @include pageFlexRow;
        justify-content: center;

        width: 40px;
        min-width: 40px;
        height: 40px;
        max-height: 40px;

        border-radius: 50%;
        background: var(--#{$prefix}icon-secondary-bg-hover);
        margin-right: 10px;

        svg {
            fill: var(--#{$prefix}sub-text);
        }
    }

    &__clear {
        position: absolute;
        right: 16px;

        top: 0;
        bottom: 0;
        margin: auto 0;

        cursor: pointer;

        max-width: 20px;
        max-height: 20px;

        @include pageFlexRow;
        justify-content: center;

        svg {
            width: 20px;
            height: 20px;
        }
    }

    input {
        width: 100%;

        font-style: normal;
        font-weight: 600;
        font-size: var(--#{$prefix}h5-fs);

        color: var(--#{$prefix}primary-text);

        background-color: transparent;
        outline: none;
        border: none;
    }
}

.active {
    background: var(--#{$prefix}main-background);
    border: 1px solid var(--#{$prefix}sub-text);

    .search-input__logo {
        background: var(--#{$prefix}btn-bg-color-hover);
    }

    input {
        color: var(--#{$prefix}primary-text);
    }
}
</style>
