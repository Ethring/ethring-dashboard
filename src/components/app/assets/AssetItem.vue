<template>
    <div class="assets__item">
        <template v-if="column === 'name'">
            <div class="network">
                <div class="logo">
                    <TokenIcon width="24" height="24" :token="item" />
                    <div class="chain">
                        <img :src="item.chainLogo" />
                    </div>
                </div>
                <div class="info">
                    <div class="name">{{ item.name || item.symbol }}</div>
                    <div class="type" v-if="item.balanceType">{{ getFormattedName(item.balanceType) }}</div>
                    <div class="unlock" v-if="item.unlockTimestamp">
                        Unlock <span> {{ getFormattedDate(item.unlockTimestamp) }} </span>
                    </div>
                    <div class="apr" v-if="item.apr"><span>APR </span> {{ formatNumber(item.apr, 2) }} <span>%</span></div>
                </div>
            </div>
        </template>
        <template v-if="column === 'balance'">
            <div class="amount">
                <div class="value">
                    <NumberTooltip :value="balance" decimals="3" />
                </div>

                <span class="symbol">{{ item?.symbol }}</span>
            </div>
        </template>
        <template v-if="column === 'balanceUsd'">
            <div class="amount">
                <span class="symbol">$</span>
                <div class="value"><NumberTooltip :value="balanceUsd" /></div>
            </div>
        </template>
    </div>
</template>
<script>
import { computed } from 'vue';
import { useStore } from 'vuex';

import TokenIcon from '@/components/ui/TokenIcon';
import NumberTooltip from '@/components/ui/NumberTooltip';

import { formatNumber } from '@/helpers/prettyNumber';

import BigNumber from 'bignumber.js';

import { getFormattedName, getFormattedDate } from '@/shared/utils/assets';

export default {
    name: 'AssetItem',
    props: {
        item: {
            required: true,
        },
        column: {
            default: null,
        },
    },
    components: {
        TokenIcon,
        NumberTooltip,
    },
    setup(props) {
        const store = useStore();
        const showBalance = computed(() => store.getters['app/showBalance']);

        const balance = computed(() => {
            if (!showBalance.value) {
                return '****';
            }

            return BigNumber(props.item?.balance).toString();
        });

        const balanceUsd = computed(() => {
            if (!showBalance.value) {
                return '****';
            }

            return BigNumber(props.item?.balanceUsd).toString();
        });

        return {
            balance,
            balanceUsd,

            getFormattedName,
            getFormattedDate,
            formatNumber,
        };
    },
};
</script>
<style lang="scss">
.assets__item {
    vertical-align: center !important;
    color: var(--#{$prefix}black);

    .network {
        display: inline-flex;

        .logo {
            margin-right: 8px;
            position: relative;

            img {
                width: 32px;
                height: 32px;
            }
        }

        .chain {
            width: 16px;
            height: 16px;
            border-radius: 50%;

            @include pageFlexRow;
            justify-content: center;

            position: absolute;
            top: 16px;
            left: 26px;

            img {
                border-radius: 50%;
                object-position: center;
                object-fit: contain;
                width: 100%;
                height: 100%;
            }
        }

        .symbol {
            font-size: var(--#{$prefix}h6-fs);
            font-weight: 400;
            color: var(--#{$prefix}secondary-text);
        }

        .name {
            font-size: var(--#{$prefix}h6-fs);
            color: var(--#{$prefix}primary-text);
            font-weight: 400;
            margin-left: 8px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 200px;
        }
    }

    .info {
        @include pageFlexRow;
        line-height: 20px;
        font-weight: 400;
        font-size: var(--#{$prefix}small-lg-fs);

        div:not(:first-child) {
            &::before {
                content: '\2022';
                margin: 0 4px;
                color: var(--#{$prefix}checkbox-text);
            }
        }

        .type {
            color: var(--#{$prefix}sub-text);
            font-weight: 400;
        }

        .apr {
            color: var(--#{$prefix}sub-text);
            font-weight: 600;
        }

        .apr,
        .unlock {
            span {
                color: var(--#{$prefix}mute-apr-text);
                font-weight: 400;
            }
        }

        .unlock {
            color: var(--#{$prefix}mute-apr-text);
            font-weight: 300;
        }
    }

    .amount {
        display: inline-flex;
        align-items: flex-end;

        .symbol {
            font-size: var(--#{$prefix}small-lg-fs);
            font-weight: 400;
            color: var(--#{$prefix}secondary-text);
            line-height: var(--#{$prefix}h6-fs);
            margin-right: 3px;
        }

        .value {
            line-height: var(--#{$prefix}h5-fs);
            font-size: var(--#{$prefix}h6-fs);
            font-weight: 400;
            margin-right: 3px;
            color: var(--#{$prefix}primary-text);
        }
    }
}
</style>
