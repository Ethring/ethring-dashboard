<template>
    <div class="asset__item-header">
        <div class="asset__item-header-info">
            <div class="asset__item-header-logo">
                <img
                    v-if="logoURI && !showImagePlaceholder"
                    :src="logoURI"
                    class="token__logo"
                    @error="showImagePlaceholder = true"
                    @load="showImagePlaceholder = false"
                />
                <TokenLogo v-if="!logoURI || showImagePlaceholder" class="token__logo" />
            </div>
            <div class="asset__item-header-name">
                {{ title }}
                <div class="asset__item-header-value" v-if="value > 0">
                    {{ value }}
                    <span class="asset__item-header-symbol"> % </span>
                </div>
            </div>
        </div>
        <div class="asset__item-header-reward" v-if="showRewards">
            {{ $t('tokenOperations.rewards') + ':' }}
            <div class="asset__item-header-value">{{ showBalance ? formatNumber(reward) : '***' }}</div>
            <span class="asset__item-header-symbol__left"> $ </span>
        </div>
        <div class="asset__item-header-balance">
            <span class="asset__item-header-symbol">$</span>
            {{ showBalance ? formatNumber(totalBalance, 2) : '***' }}
        </div>
    </div>
</template>
<script>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';

import TokenLogo from '@/assets/icons/dashboard/tokenLogo.svg';

import { formatNumber } from '@/helpers/prettyNumber';

export default {
    name: 'AssetItemHeader',
    props: {
        title: {
            required: true,
        },
        value: {
            required: true,
        },
        reward: {
            type: Number,
            default: 0,
        },
        showRewards: {
            type: Boolean,
            default: false,
        },
        totalBalance: {
            type: Number,
            default: 0,
        },
        logoURI: {
            type: String,
            default: '',
        },
    },
    components: {
        TokenLogo,
    },
    setup() {
        const store = useStore();
        const showBalance = computed(() => store.getters['app/showBalance']);

        const showImagePlaceholder = ref(false);

        return {
            showBalance,
            showImagePlaceholder,

            formatNumber,
        };
    },
};
</script>
<style lang="scss" scoped>
.asset__item-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 16px;
    border-bottom: 1px dashed var(--#{$prefix}border-secondary-color);
    cursor: pointer;

    &-info {
        display: flex;
        align-items: center;
        width: 60%;
    }

    &-logo {
        width: 40px;
        height: 40px;
        border: 1px solid var(--#{$prefix}primary-text);
        border-radius: 50%;

        display: flex;
        align-items: center;
        justify-content: center;
    }

    &-name {
        color: var(--#{$prefix}primary-text);
        font-size: 20px;
        font-weight: 600;

        display: flex;
        align-items: baseline;
        margin-left: 8px;
    }

    &-value {
        font-size: 18px;
        color: var(--#{$prefix}eye-logo-hover);
        font-weight: 600;
        margin-left: 8px;
    }

    &-symbol {
        font-size: 14px;
        color: var(--#{$prefix}mute-text);
        font-weight: 400;
        &__left {
            margin-left: 5px;
        }
    }

    &-balance {
        color: var(--#{$prefix}primary-text);
        font-size: 16px;
        font-weight: 600;
        text-align: right;
        width: 20%;
    }

    &-reward {
        display: flex;
        align-items: baseline;
        width: 20%;

        color: var(--#{$prefix}mute-text);
        font-size: 14px;
    }
}

.token__logo {
    width: 18px;
    height: 18px;
}
</style>
