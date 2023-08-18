<template>
    <div class="search-input" :class="isActive">
        <div class="search-input__logo">
            <searchSvg />
        </div>
        <div>
            <span>{{ $t('dashboard.search') }}</span>
            <input @focus="isActive = 'active'" @blur="isActive = ''" v-model="text" placeholder="Token name" />
        </div>
        <div v-if="text.length" class="search-input__clear" @click="clearValue">
            <clearSvg />
        </div>
    </div>
</template>

<script>
import { ref, watch } from 'vue';
import searchSvg from '@/assets/icons/app/search.svg';
import clearSvg from '@/assets/icons/app/xmark.svg';

export default {
    name: 'SearchInput',
    components: {
        searchSvg,
        clearSvg,
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
    background: #f0f0f0;
    border-radius: 16px;
    padding: 20px 32px;
    display: flex;
    align-items: center;
    position: relative;
    border: 2px solid #fff;
    span {
        color: var(--#{$prefix}mineralGreen);
        display: block;
        font-family: 'Poppins';
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
        border-radius: 50%;
        background: var(--#{$prefix}geyser);
        margin-right: 10px;
    }

    &__clear {
        position: absolute;
        right: 32px;
        cursor: pointer;
    }

    input {
        font-family: 'Poppins_SemiBold';
        font-style: normal;
        font-weight: 700;
        font-size: var(--#{$prefix}h4-fs);
        line-height: 33px;
        color: var(--#{$prefix}gulfStream);
        border: none;
        background-color: transparent;
        outline: none;
    }
}
.active {
    background: #ffffff;
    border: 2px solid var(--#{$prefix}sub-text);
    .search-input__logo {
        background: var(--#{$prefix}turquoise);
    }
    input {
        color: var(--#{$prefix}black);
    }
}
</style>
