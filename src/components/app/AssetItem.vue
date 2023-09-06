<template>
    <div class="tokens__item">
        <div class="network">
            <div class="logo">
                <TokenIcon width="24" height="24" :token="item" :src="item.logo" />
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
            <div class="value">
                {{ showBalance ? formatNumber(item.balance) : '****' }}
            </div>
            <div class="symbol">{{ item?.code }}</div>
        </div>
        <div class="change">
            <div class="value"><span>$</span>{{ showBalance ? formatNumber(item.balanceUsd, 2) : '****' }}</div>
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
    setup() {
        const store = useStore();
        const showBalance = computed(() => store.getters['app/showBalance']);

        return {
            formatNumber,
            showBalance,
        };
    },
};
</script>
<style lang="scss">
.tokens__item {
    display: flex;
    align-items: center;
    font-size: 22px;
    color: $black;
    padding: 5px 10px 10px 0;
    margin: 4px 0;
    box-sizing: border-box;

    &:last-child {
        padding-bottom: 0;
    }

    &:not(:last-child) {
        border-bottom: 1px solid var(--#{$prefix}border-color-op-05);
    }

    .network {
        width: 60%;
        display: flex;
        align-items: center;

        .logo {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #d9f4f1;
            margin-right: 10px;
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;

            .token-icon {
                width: 24px;
                height: 24px;

                img {
                    filter: none;
                    width: 80%;
                    height: 80%;
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
            font-size: 18px;
            font-weight: 500;
            color: var(--#{$prefix}secondary-text);
        }

        .name {
            font-size: 16px;
            color: var(--#{$prefix}primary-text);
            margin-left: 8px;
        }
    }

    .info {
        display: flex;
        align-items: center;
    }

    .amount {
        width: 20%;
        display: flex;
        align-items: baseline;

        .value {
            font-size: 14px;
            font-weight: 400;
            margin-right: 3px;
            color: var(--#{$prefix}primary-text);
        }

        .symbol {
            font-size: 14px;
            font-weight: 400;
            color: var(--#{$prefix}secondary-text);
        }
    }

    .change {
        width: 20%;

        span {
            font-size: 14px;
            color: var(--#{$prefix}mute-text);
            text-align: right;
            font-weight: 400;
            margin-right: 3px;
        }

        .value {
            font-size: 14px;
            font-weight: 400;
            text-align: right;
            color: var(--#{$prefix}primary-text);
        }
    }
}
</style>
