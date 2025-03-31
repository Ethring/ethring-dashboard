<template>
    <div class="wallet-info-container">
        <div class="wallet-info">
            <div class="wallet-info__wallet">
                <div class="wallet-info__address">
                    <div class="address">
                        {{ cutAddress(targetAccount) }}
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
                    <Amount :value="totalBalance" :decimals="3" type="usd" symbol="$" />
                    <div class="balance__hide" @click="toggleViewBalance">
                        <EyeOpenIcon v-if="showBalance" />
                        <EyeCloseIcon v-else />
                    </div>
                </div>
            </div>
        </div>
        <LinesBack class="wallet-info-lines" />
    </div>
</template>
<script>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useClipboard } from '@vueuse/core';

import { Ecosystem } from '@/shared/models/enums/ecosystems.enum';

import { cutAddress } from '@/shared/utils/address';

import Amount from '@/components/app/Amount';

import LinesBack from '@/assets/images/wallet-info/lines.svg';

import EyeOpenIcon from '@/assets/icons/dashboard/eyeOpen.svg';
import EyeCloseIcon from '@/assets/icons/dashboard/eye.svg';
import CopyIcon from '@/assets/icons/platform-icons/copy.svg';

import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';

export default {
    name: 'WalletInfo',
    components: {
        EyeOpenIcon,
        EyeCloseIcon,
        CopyIcon,
        LinesBack,
        Amount,
    },
    setup() {
        const store = useStore();

        const { copy, copied } = useClipboard();

        const { walletAccount, currentChainInfo, action, getRealAddress } = useAdapter();

        const isAllTokensLoading = computed(() => store.getters['tokens/loader']);

        const showBalance = computed(() => store.getters['app/showBalance']);

        const targetAccount = computed(() => store.getters['tokens/targetAccount'] || walletAccount.value);

        const totalBalance = computed(() => store.getters['tokens/getTotalBalanceByType'](targetAccount.value, 'totalBalances') || 0);

        const toggleViewBalance = () => store.dispatch('app/toggleViewBalance');

        const handleOnCopyAddress = async () => {
            if (currentChainInfo.value.ecosystem === Ecosystem.EVM) return copy(await getRealAddress(Ecosystem.EVM));

            action('SET_MODAL_ECOSYSTEM', currentChainInfo.value.ecosystem);
            return action('SET_MODAL_STATE', { name: 'addresses', isOpen: true });
        };

        return {
            isAllTokensLoading,
            totalBalance,
            currentChainInfo,
            targetAccount,
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
.wallet-info-container {
    position: relative;
    z-index: 3;
    background-color: var(--#{$prefix}banner-color);

    padding: 18px 24px;
    box-sizing: border-box;

    border-radius: 16px;
    height: 80px;

    display: flex;
    justify-content: space-between;
    align-items: center;

    overflow: hidden;
}

.wallet-info-lines {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
    transform: translate(30%, -35%);
}

.wallet-info {
    @include pageFlexColumn;
    align-items: baseline;

    z-index: 2;

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
            height: 28px;

            .value {
                @include pageFlexRow;
            }

            &__hide {
                margin: 1px 0 0 10px;
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
