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
                <div v-if="currentChainInfo && isDashboard" class="balance__hide" @click="toggleViewBalance">
                    <EyeOpenIcon v-if="showBalance" />
                    <EyeCloseIcon v-else />
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

import useAdapter from '@/Adapter/compositions/useAdapter';

import { cutAddress } from '@/helpers/utils';

import NumberTooltip from '@/components/ui/NumberTooltip';

import EyeOpenIcon from '@/assets/icons/dashboard/eyeOpen.svg';
import EyeCloseIcon from '@/assets/icons/dashboard/eye.svg';

export default {
    name: 'WalletInfo',
    components: {
        NumberTooltip,
        EyeOpenIcon,
        EyeCloseIcon,
    },
    setup() {
        const store = useStore();
        const router = useRouter();

        const { walletAccount, currentChainInfo } = useAdapter();

        const isAllTokensLoading = computed(() => store.getters['tokens/loader']);

        const showBalance = computed(() => store.getters['app/showBalance']);

        const totalBalance = computed(() => store.getters['tokens/totalBalances'][walletAccount.value]);

        const isDashboard = computed(() => router.currentRoute.value.path === '/main' || router.currentRoute.value.path === '/');

        const toggleViewBalance = () => store.dispatch('app/toggleViewBalance');

        return {
            isAllTokensLoading,
            totalBalance,
            currentChainInfo,
            walletAccount,
            cutAddress,
            showBalance,
            isDashboard,

            toggleViewBalance,
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
                font-weight: 600;
                margin-right: 16px;
            }

            span {
                font-weight: 400;
                color: var(--#{$prefix}symbol-text);
                margin-right: -6px;
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
