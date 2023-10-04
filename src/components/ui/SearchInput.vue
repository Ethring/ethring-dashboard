<template>
    <div class="search-input" :class="isActive">
        <div class="search-input__logo">
            <SearchIcon />
        </div>
        <div>
            <span>{{ $t('dashboard.search') }}</span>
            <input @focus="isActive = 'active'" @blur="isActive = ''" v-model="text" placeholder="Token name" />
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
$padding-tb: 20px;
$padding-lr: 32px;

.search-input {
    position: relative;

    display: flex;
    align-items: center;

    height: 100%;
    max-height: 100px;

    padding: $padding-tb $padding-lr;

    border: 2px solid var(--#{$prefix}white);
    border-radius: 16px;

    background: var(--#{$prefix}select-bg-color);

    span {
        color: var(--#{$prefix}base-text);
        display: block;
        font-style: normal;
        font-weight: 500;
        font-size: var(--#{$prefix}small-lg-fs);
        line-height: 21px;
    }

    &__logo {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 40px;
        min-width: 40px;
        height: 40px;
        max-height: 40px;

        border-radius: 50%;

        background: var(--#{$prefix}icon-secondary-bg-hover);
        margin-right: 10px;
    }

    &__clear {
        position: absolute;
        right: $padding-lr;

        top: 0;
        bottom: 0;
        margin: auto 0;

        cursor: pointer;

        max-width: 20px;
        max-height: 20px;

        display: flex;
        justify-content: center;
        align-items: center;

        svg {
            width: 20px;
            height: 20px;
        }
    }

    input {
        font-style: normal;
        font-weight: 600;
        font-size: var(--#{$prefix}h4-fs);

        background-color: transparent;
        outline: none;
        border: none;
    }
}

.active {
    background: var(--#{$prefix}select-bg-color);
    border: 2px solid var(--#{$prefix}sub-text);

    .search-input__logo {
        background: var(--#{$prefix}btn-bg-color-hover);
    }

    input {
        color: var(--#{$prefix}black);
    }
}
</style>
