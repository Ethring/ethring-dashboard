<template>
    <div class="asset__item-header">
        <div class="asset__item-header-info">
            <TokenLogo v-if="title === 'Tokens'" />
            <div v-else class="asset__item-header-logo">
                <NftsLogo v-if="title === 'NFT'" />
                <img
                    v-else-if="logoURI && !showImagePlaceholder"
                    :src="logoURI"
                    class="token__logo-img"
                    @error="showImagePlaceholder = true"
                    @load="showImagePlaceholder = false"
                />
                <PlaceHolderLogo v-else class="token__logo" />
            </div>

            <div class="asset__item-header-name">
                {{ title }}
                <!-- <div class="asset__item-header-value" v-if="value > 0">
                    {{ formatNumber(value, 2) }}
                    <span class="asset__item-header-symbol"> % </span>
                </div> -->
            </div>
        </div>

        <!-- <div class="column">
            <div class="asset__item-header-health" v-if="healthRate">
                <h5>{{ formatNumber(healthRate, 2) }} <span>%</span></h5>
                <div
                    class="asset__item-header-health-bar"
                    :class="`asset__item-header-health-bar-${getPercentageQuarter(healthRate)}`"
                    :style="{ width: `${healthRate > 0 ? healthRate : 1}%` }"
                ></div>
            </div>
        </div> -->
        <div class="column">
            <div class="asset__item-header-balance">
                <span class="asset__item-header-symbol">$</span>
                <NumberTooltip v-if="showBalance" :value="totalBalance" />
                <h4 v-else>****</h4>
            </div>

            <div class="asset__item-header-reward" v-if="showRewards">
                <span class="asset__item-header-reward-title">{{ $t('tokenOperations.rewards') }}:</span>
                <NumberTooltip v-if="showBalance" :value="reward" />
                <p v-else>****</p>
                <span class="asset__item-header-reward-symbol"> $ </span>
            </div>
        </div>
    </div>
</template>
<script>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';

import TokenLogo from '@/assets/icons/dashboard/wallet.svg';
import NftsLogo from '@/assets/icons/dashboard/nfts.svg';
import NumberTooltip from '@/components/ui/NumberTooltip';
import PlaceHolderLogo from '@/assets/icons/dashboard/tokenLogo.svg';

import { formatNumber } from '@/helpers/prettyNumber';

export default {
    name: 'AssetItemHeader',
    props: {
        title: {
            required: true,
        },
        value: {
            required: false,
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
        healthRate: {
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
        NftsLogo,
        NumberTooltip,
        PlaceHolderLogo,
    },
    setup() {
        const store = useStore();
        const showBalance = computed(() => store.getters['app/showBalance']);

        const showImagePlaceholder = ref(false);

        const getPercentageQuarter = (val) => {
            if (val > 75) {
                return 100;
            } else if (val > 50) {
                return 75;
            } else if (val > 25) {
                return 50;
            }

            return 25;
        };

        return {
            showBalance,
            showImagePlaceholder,

            getPercentageQuarter,
            formatNumber,
        };
    },
};
</script>
<style lang="scss" scoped>
.column {
    display: flex;
    flex-direction: column;
    width: 20%;
}

.asset__item-header {
    @include pageFlexRow;

    justify-content: space-between;

    &-info {
        @include pageFlexRow;
        width: 60%;
    }

    &-logo {
        width: 40px;
        height: 40px;
        border-radius: 50%;

        @include pageFlexRow;
        justify-content: center;
    }

    &-name {
        color: var(--#{$prefix}primary-text);
        font-size: var(--#{$prefix}h4-fs);
        font-weight: 500;

        display: flex;
        align-items: baseline;
        margin-left: 8px;

        .asset__item-header-value {
            &::before {
                content: '\2022';
                margin-right: 8px;
                color: var(--#{$prefix}checkbox-text);
            }
        }
    }

    &-value {
        font-size: var(--#{$prefix}h5-fs);
        color: var(--#{$prefix}eye-logo-hover);
        font-weight: 500;
        margin-left: 8px;
    }

    &-symbol {
        font-size: var(--#{$prefix}default-fs);
        line-height: 16px;
        color: var(--#{$prefix}mute-text);
        font-weight: 400;
        margin-right: 3px;

        &__left {
            margin-left: 5px;
        }
    }

    &-balance {
        display: flex;
        align-self: flex-end;

        color: var(--#{$prefix}primary-text);
        font-size: var(--#{$prefix}h5-fs);
        line-height: 14px;
        font-weight: 500;
    }

    &-reward {
        display: flex;
        align-self: flex-end;
        color: var(--#{$prefix}eye-logo-hover);
        font-weight: 500;
        margin-top: 6px;

        span {
            font-size: var(--#{$prefix}small-lg-fs);
            font-weight: 400;
            color: var(--#{$prefix}mute-text);
        }

        &-title {
            margin-right: 6px;
        }

        p {
            color: var(--#{$prefix}sub-text);
            font-size: var(--#{$prefix}small-lg-fs);
            font-weight: 500;
            margin: 0 2px 0 6px;
        }

        &-symbol {
            margin-left: 2px;
        }
    }

    &-health {
        width: 64px;
        height: 24px;
        border-radius: 24px;
        background-color: var(--#{$prefix}percentage-bar-bg-color);
        position: relative;

        @include pageFlexRow;
        justify-content: center;
        overflow: hidden;

        h5 {
            z-index: 1;
            font-weight: 700;
            font-size: var(--#{$prefix}small-md-fs);

            span {
                font-weight: 400;
                margin-left: -2px;
            }
        }

        &-bar {
            height: 24px;
            position: absolute;
            left: 0;

            &-100 {
                background-color: var(--#{$prefix}percentage-bar-100);
            }
            &-75 {
                background-color: var(--#{$prefix}percentage-bar-75);
            }
            &-50 {
                background-color: var(--#{$prefix}percentage-bar-50);
            }
            &-25 {
                background-color: var(--#{$prefix}percentage-bar-25);
            }
        }
    }
}

.token__logo {
    width: 32px;
    height: 32px;

    &-img {
        width: 32px;
        height: 32px;
        border-radius: 50%;
    }
}
</style>
