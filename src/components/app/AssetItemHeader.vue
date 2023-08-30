<template>
    <div class="asset__item-header">
        <div class="asset__item-header-info">
            <div class="asset__item-header-logo">
                <TokenLogo class="token__logo" />
            </div>
            <div class="asset__item-header-name">
                {{ title }}
                <div class="asset__item-header-value">
                    {{ value }}
                    <span class="asset__item-header-symbol"> % </span>
                </div>
            </div>
        </div>
        <div class="asset__item-header-reward" v-if="showRewards">
            {{ $t('tokenOperations.rewards') + ':' }}
            <div class="asset__item-header-value">65.05</div>
            <span class="asset__item-header-symbol__left"> $ </span>
        </div>
        <div class="asset__item-header-balance">
            <span class="asset__item-header-symbol">$</span>
            12 510
        </div>
    </div>
</template>
<script>
import { computed } from 'vue';
import { useStore } from 'vuex';

import { prettyNumber } from '@/helpers/prettyNumber';

import TokenLogo from '@/assets/icons/dashboard/tokenLogo.svg';

export default {
    name: 'AssetItemHeader',
    props: {
        title: {
            required: true,
        },
        value: {
            required: true,
        },
        showRewards: {
            type: Boolean,
            default: false,
        },
    },
    components: {
        TokenLogo,
    },
    setup() {
        const store = useStore();
        const showBalance = computed(() => store.getters['app/showBalance']);

        return {
            showBalance,
            prettyNumber,
        };
    },
};
</script>
<style lang="scss" scoped>
.asset__item-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 73px;
    margin-bottom: 5px;
    border-bottom: 1px dashed #73b1b1;
    cursor: pointer;

    &-info {
        display: flex;
        align-items: center;
        width: 60%;
    }

    &-logo {
        width: 40px;
        height: 40px;
        border: 1px solid #1c1f2c;
        border-radius: 50%;

        display: flex;
        align-items: center;
        justify-content: center;
    }

    &-name {
        color: #1c1f2c;
        font-size: 20px;
        font-family: 'Poppins_SemiBold';

        display: flex;
        align-items: baseline;
        margin-left: 8px;
    }

    &-value {
        font-size: 18px;
        color: #0d7e71;
        font-family: 'Poppins_Semibold';
        margin-left: 8px;
    }

    &-symbol {
        font-size: 14px;
        font-family: 'Poppins_Regular';
        color: #494c56;

        &__left {
            margin-left: 5px;
        }
    }

    &-balance {
        color: #1c1f2c;
        font-size: 16px;
        font-family: 'Poppins_Semibold';
        text-align: right;
        width: 20%;
    }

    &-reward {
        display: flex;
        align-items: center;
        width: 20%;

        color: #494c56;
        font-size: 14px;
        font-family: 'Poppins_Regular';
    }
}

.token__logo {
    fill: #0d7e71;
    width: 18px;
    height: 18px;
}
</style>
