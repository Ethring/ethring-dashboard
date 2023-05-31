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
        color: $colorDarkGray;
        display: block;
        font-family: 'Poppins';
        font-style: normal;
        font-weight: 500;
        font-size: 14px;
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
        background: $colorLightGreen;
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
        font-size: 22px;
        line-height: 33px;
        color: #73b1b1;
        border: none;
        background-color: transparent;
        outline: none;
    }
}
.active {
    background: #ffffff;
    border: 2px solid #0d7e71;
    .search-input__logo {
        background: #3fdfae;
    }
    input {
        color: $colorBlack;
    }
}
</style>
