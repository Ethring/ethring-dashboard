<template>
    <div class="wallet-info">
        <div class="wallet-info__network">
            <WalletIcon />
        </div>

        <div class="wallet-info__wallet">
            <div class="address">
                {{ cutAddress(walletAccount) }}
            </div>

            <div class="balance">
                <div class="value">
                    <span>$</span>
                    {{ showBalance ? formatNumber(totalBalance, 2) : '****' }}
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import { computed } from 'vue';
import { useStore } from 'vuex';

import useAdapter from '@/Adapter/compositions/useAdapter';

import { cutAddress } from '@/helpers/utils';
import { formatNumber } from '@/helpers/prettyNumber';

import WalletIcon from '@/assets/icons/dashboard/wallet.svg';

export default {
    name: 'WalletInfo',
    components: {
        WalletIcon,
    },
    setup() {
        const store = useStore();

        const { walletAccount, currentChainInfo } = useAdapter();

        const showBalance = computed(() => store.getters['app/showBalance']);

        const totalBalance = computed(() => store.getters['tokens/totalBalances'][walletAccount.value]);

        return {
            totalBalance,
            currentChainInfo,
            walletAccount,
            formatNumber,
            cutAddress,
            showBalance,
        };
    },
};
</script>
<style lang="scss" scoped>
.wallet-info {
    display: flex;
    align-items: center;

    &__network {
        width: 78px;
        height: 78px;

        @include pageFlexRow;
        justify-content: center;

        border-radius: 50%;
        margin-right: 16px;
        background: var(--#{$prefix}banner-logo-color);

        img {
            width: 60%;
        }

        svg {
            fill: var(--#{$prefix}black);
            opacity: 1;
        }
    }

    &__wallet {
        display: flex;
        flex-direction: column;
        justify-content: center;

        & > div {
            height: auto;
        }

        & > div:first-child {
            margin-bottom: 15px;
        }

        .address {
            color: var(--#{$prefix}mute-text);

            font-weight: 400;
            font-size: var(--#{$prefix}default-fs);

            svg {
                margin-left: 4px;
                stroke: var(--#{$prefix}black);
            }
        }

        .balance {
            @include pageFlexRow;

            font-weight: 600;
            font-size: var(--#{$prefix}h2-fs);
            color: var(--#{$prefix}primary-text);

            margin-top: -3px;
            user-select: none;

            .value {
                min-width: 165px;
                font-weight: 600;
            }

            span {
                font-weight: 400;
                color: var(--#{$prefix}symbol-text);
            }

            svg {
                cursor: pointer;
                fill: var(--#{$prefix}eye-logo);

                &:hover {
                    fill: var(--#{$prefix}eye-logo-hover);
                }
            }
        }
    }
}
</style>
