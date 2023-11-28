<template>
    <div class="wallet-info">
        <div class="wallet-info__wallet">
            <div class="address">
                {{ cutAddress(walletAccount) }}
            </div>
            <template v-if="isAllTokensLoading && !totalBalance">
                <a-skeleton-input active />
            </template>
            <div v-else class="balance">
                <div class="value">
                    <span>$</span>
                    <NumberTooltip v-if="showBalance" :value="totalBalance" />
                    <span v-else>****</span>
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

import NumberTooltip from '@/components/ui/NumberTooltip';

export default {
    name: 'WalletInfo',
    components: {
        NumberTooltip,
    },
    setup() {
        const store = useStore();

        const { walletAccount, currentChainInfo } = useAdapter();

        const isAllTokensLoading = computed(() => store.getters['tokens/loader']);

        const showBalance = computed(() => store.getters['app/showBalance']);

        const totalBalance = computed(() => store.getters['tokens/totalBalances'][walletAccount.value]);

        return {
            isAllTokensLoading,
            totalBalance,
            currentChainInfo,
            walletAccount,
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

    &__wallet {
        display: flex;
        flex-direction: column;
        justify-content: center;

        & > div {
            height: auto;
        }

        & > div:first-child {
            margin-bottom: 8px;
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

            font-weight: 700;
            font-size: var(--#{$prefix}h3-fs);
            color: var(--#{$prefix}primary-text);

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
