<template>
    <div class="tokens__item">
        <div class="network">
            <div class="logo">
                <img v-if="item.avatar" :src="item.avatar" />
                <TokenIcon v-else width="24" height="24" :token="item" />
                <div class="chain">
                    <img :src="item.chainLogo" />
                </div>
            </div>
            <div class="info">
                <div class="name">{{ item.name }}</div>
                <slot></slot>
            </div>
        </div>
        <div class="amount">
            <div v-if="!item?.symbol && balance.value" class="symbol">$</div>
            <div :title="balance.value" class="value">
                {{ balance.value ? balance.pretty : '-' }}
            </div>
            <div v-if="item?.symbol" class="symbol">{{ item?.symbol }}</div>
        </div>
        <div class="change">
            <div v-if="balanceUsd.value" :title="balanceUsd.value" class="value"><span>$</span>{{ balanceUsd.pretty }}</div>
            <div v-else class="value">-</div>
        </div>
    </div>
</template>
<script>
import { computed } from 'vue';
import { useStore } from 'vuex';

import TokenIcon from '@/components/ui/TokenIcon';

import { formatNumber } from '@/helpers/prettyNumber';

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
                pretty: formatNumber(props.item?.balance, 4),
                value: props.item?.balance,
            };
        });

        const balanceUsd = computed(() => {
            if (!showBalance.value) {
                return defaultVal;
            }

            return {
                pretty: formatNumber(props.item?.balanceUsd, 2),
                value: props.item?.balanceUsd,
            };
        });

        return {
            balance,
            balanceUsd,
        };
    },
};
</script>
<style lang="scss">
.tokens__item {
    display: flex;
    align-items: center;
    color: var(--#{$prefix}black);
    padding-right: 10px;
    width: 100%;

    &:not(:last-child) {
        margin-bottom: 10px;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--#{$prefix}border-color-op-05);
    }

    .network {
        width: 60%;
        display: flex;
        align-items: center;

        .logo {
            margin-right: 10px;
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
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 200px;
        }
    }

    .info {
        display: flex;
        align-items: center;
        line-height: 20px;
    }

    .amount {
        width: 20%;
        display: flex;
        align-items: baseline;

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

    .change {
        width: 20%;

        span {
            font-size: var(--#{$prefix}small-lg-fs);
            font-weight: 400;
            text-align: right;
            margin-right: 3px;
        }

        .value {
            font-size: var(--#{$prefix}small-lg-fs);
            font-weight: 400;

            text-align: right;
            color: var(--#{$prefix}primary-text);
        }
    }
}
</style>
