<template>
    <div class="wallet-info">
        <div class="wallet-info__wallet">
            <div class="wallet-info__address">
                <div class="address">
                    {{ cutAddress(walletAccount) }}
                </div>
                <a-tooltip placement="right" :title="copied ? $t('adapter.copiedAddressTooltip') : $t('adapter.copyAddressTooltip')">
                    <span @click="handleOnCopyAddress">
                        <CopyIcon />
                    </span>
                </a-tooltip>
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
                <div class="balance__hide" v-if="currentChainInfo" @click="toggleViewBalance">
                    <EyeOpenIcon v-if="showBalance" />
                    <EyeCloseIcon v-else />
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import { computed, inject } from 'vue';
import { useStore } from 'vuex';
import { useClipboard } from '@vueuse/core';

import { ECOSYSTEMS } from '@/Adapter/config';

import { cutAddress } from '@/helpers/utils';

import NumberTooltip from '@/components/ui/NumberTooltip';

import EyeOpenIcon from '@/assets/icons/dashboard/eyeOpen.svg';
import EyeCloseIcon from '@/assets/icons/dashboard/eye.svg';
import CopyIcon from '@/assets/icons/app/copy.svg';

export default {
    name: 'WalletInfo',
    components: {
        NumberTooltip,
        EyeOpenIcon,
        EyeCloseIcon,
        CopyIcon,
    },
    setup() {
        const store = useStore();
        const useAdapter = inject('useAdapter');

        const { copy, copied } = useClipboard();

        const { walletAccount, currentChainInfo, action } = useAdapter();

        const isAllTokensLoading = computed(() => store.getters['tokens/loader']);

        const showBalance = computed(() => store.getters['app/showBalance']);

        const totalBalance = computed(() => store.getters['tokens/totalBalances'][walletAccount.value]);

        const toggleViewBalance = () => store.dispatch('app/toggleViewBalance');

        const handleOnCopyAddress = () => {
            if (currentChainInfo.value.ecosystem === ECOSYSTEMS.EVM) {
                return copy(walletAccount.value);
            }

            action('SET_MODAL_ECOSYSTEM', currentChainInfo.value.ecosystem);
            return action('SET_MODAL_STATE', { name: 'addresses', isOpen: true });
        };

        return {
            isAllTokensLoading,
            totalBalance,
            currentChainInfo,
            walletAccount,
            cutAddress,
            showBalance,
            copied,

            toggleViewBalance,
            handleOnCopyAddress,
        };
    },
};
</script>
<style lang="scss" scoped>
.wallet-info {
    @include pageFlexColumn;
    align-items: baseline;

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
        }

        .balance {
            @include pageFlexRow;
            margin: auto 0;
            font-weight: 700;
            font-size: var(--#{$prefix}h3-fs);
            color: var(--#{$prefix}primary-text);
            user-select: none;

            .value {
                @include pageFlexRow;
            }

            &__hide {
                margin: 1px 0 0 14px;
            }

            span {
                font-weight: 400;
                color: var(--#{$prefix}symbol-text);
            }

            svg {
                margin: auto;
                cursor: pointer;
                fill: var(--#{$prefix}eye-logo);

                &:hover {
                    fill: var(--#{$prefix}eye-logo-hover);
                }
            }
        }
    }
    &__address {
        @include pageFlexRow;

        svg {
            cursor: pointer;

            width: 16px;
            height: 16px;
            margin-left: 8px;
        }
    }
}
</style>
