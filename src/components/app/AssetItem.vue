<template>
    <div class="tokens__item">
        <div class="network">
            <div class="logo">
                <TokenIcon width="24" height="24" :token="item" />
                <div class="chain">
                    <img :src="item.chainLogo" />
                </div>
            </div>
            <div class="info">
                <div class="name">{{ item.name || item.symbol }}</div>
                <slot></slot>
            </div>
        </div>
        <div class="amount">
            <div class="value" :title="balance.value">
                {{ balance.pretty }}
            </div>
            <div class="symbol">{{ item?.symbol }}</div>
        </div>
        <div class="change">
            <template v-if="isTooltip">
                <a-tooltip placement="topRight">
                    <template #title>{{ balanceUsd.value }}</template>
                    <div class="value" :title="balanceUsd.value"><span>$</span>{{ balanceUsd.pretty }}</div>
                </a-tooltip>
            </template>
            <template v-else>
                <div class="value" :title="balanceUsd.value"><span>$</span>{{ balanceUsd.pretty }}</div>
            </template>
        </div>
    </div>
</template>
<script>
import { computed } from 'vue';
import { useStore } from 'vuex';

import TokenIcon from '@/components/ui/TokenIcon';

import { formatNumber } from '@/helpers/prettyNumber';
import BigNumber from 'bignumber.js';

export default {
    name: 'AssetItem',
    props: {
        item: {
            required: true,
        },
    },
    components: {
        TokenIcon,
    },
    setup(props) {
        const store = useStore();
        const showBalance = computed(() => store.getters['app/showBalance']);

        const defaultVal = {
            pretty: '****',
            value: '****',
        };

        const balance = computed(() => {
            if (!showBalance.value) {
                return defaultVal;
            }

            return {
                pretty: formatNumber(props.item?.balance, 6),
                value: BigNumber(props.item?.balance).toString(),
            };
        });

        const balanceUsd = computed(() => {
            if (!showBalance.value) {
                return defaultVal;
            }

            return {
                pretty: formatNumber(props.item?.balanceUsd, 4),
                value: BigNumber(props.item?.balanceUsd).toString(),
            };
        });

        const isTooltip = computed(() => {
            const { pretty = '' } = balanceUsd.value || {};

            if (!pretty) {
                return false;
            }

            return pretty?.includes('~') || false;
        });

        return {
            balance,
            balanceUsd,
            isTooltip,
        };
    },
};
</script>
<style lang="scss">
.tokens__item {
    @include pageFlexRow;

    color: var(--#{$prefix}black);
    padding-right: 10px;

    &:not(:last-child) {
        margin-bottom: 10px;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--#{$prefix}border-color-op-05);
    }

    .network {
        @include pageFlexRow;

        width: 60%;

        .logo {
            margin-right: 10px;
            position: relative;

            .token-icon {
                width: 32px;
                height: 32px;

                img {
                    filter: none;
                    width: 100%;
                    height: 100%;
                }
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
            font-weight: 500;
            margin-left: 8px;
        }
    }

    .info {
        @include pageFlexRow;
        line-height: 20px;
    }

    .amount {
        width: 20%;
        display: flex;
        align-items: baseline;

        .value {
            font-size: var(--#{$prefix}h6-fs);
            font-weight: 600;
            margin-right: 3px;
            color: var(--#{$prefix}primary-text);
        }

        .symbol {
            font-size: var(--#{$prefix}small-lg-fs);
            font-weight: 400;
            color: var(--#{$prefix}secondary-text);
        }
    }

    .change {
        width: 20%;

        span {
            font-size: var(--#{$prefix}small-lg-fs);
            font-weight: 400;
            text-align: right;
            margin-right: 3px;
        }

        .value {
            font-size: var(--#{$prefix}h6-fs);
            font-weight: 600;

            text-align: right;
            color: var(--#{$prefix}primary-text);
        }
    }
}
</style>
