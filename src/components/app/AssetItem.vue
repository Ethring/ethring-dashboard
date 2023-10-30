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
                    <div class="unlock" v-if="item.unlockTimestamp">Unlock {{ getFormattedDate(item.unlockTimestamp) }}</div>
                    <div class="apr" v-if="item.apr"><span>APR </span> {{ formatNumber(item.apr, 2) }}%</div>
                </div>
            </div>
        </template>
        <template v-if="column === 'balance'">
            <div class="amount">
                <div class="value" :title="balance.value">
                    {{ balance.pretty }}
                </div>
                <div class="symbol">{{ item?.symbol }}</div>
            </div></template
        >
        <template v-if="column === 'balanceUsd'"
            ><div class="amount">
                <div class="value" :title="balanceUsd.value"><span>$</span>{{ balanceUsd.pretty }}</div>
            </div>
        </template>
    </div>
</template>
<script>
import { computed } from 'vue';
import { useStore } from 'vuex';

import TokenIcon from '@/components/ui/TokenIcon';

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
            display: flex;
            justify-content: center;
            align-items: center;
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
            font-size: var(--#{$prefix}default-fs);
            color: var(--#{$prefix}primary-text);
            font-weight: 400;
            margin-left: 8px;
        }
    }

    .info {
        display: flex;
        align-items: center;
        line-height: 20px;

        color: var(--#{$prefix}small-lg-fs);
        font-weight: 500;
        font-size: var(--#{$prefix}small-lg-fs);

        div:not(:first-child) {
            &::before {
                content: '\2022';
                margin: 0 4px;
                color: var(--#{$prefix}checkbox-text);
            }
        }

        .type,
        .apr {
            color: var(--#{$prefix}sub-text);
            font-size: var(--#{$prefix}small-lg-fs);
            font-weight: 300;
        }

        .apr {
            span {
                font-weight: 400;
                color: var(--#{$prefix}mute-apr-text);
            }
        }

        .unlock {
            color: var(--#{$prefix}mute-apr-text);
            font-weight: 400;
            font-size: var(--#{$prefix}small-lg-fs);
        }
    }

    .amount {
        display: inline-flex;

        .value {
            font-size: var(--#{$prefix}small-lg-fs);
            font-weight: 400;
            margin-right: 3px;
            color: var(--#{$prefix}primary-text);
        }

        .symbol {
            font-size: var(--#{$prefix}small-lg-fs);
            font-weight: 400;
            color: var(--#{$prefix}secondary-text);
        }
    }
}
</style>
