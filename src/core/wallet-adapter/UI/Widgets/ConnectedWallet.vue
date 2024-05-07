<template>
    <div class="connected-wallet" @click="handleOnClickConnectedWallet(wallet)">
        <div class="left-side">
            <div class="module-logo-container">
                <ModuleIcon :ecosystem="wallet.ecosystem" :module="wallet.walletModule" background="#1C1F2C" />
                <CheckIcon v-if="wallet.ecosystem === currentChainInfo.ecosystem" class="check-icon" />
            </div>
            <div class="account-name">
                {{ cutAddress(wallet.account, 10, 4) }}
            </div>
        </div>

        <div class="right-side">
            <div class="more-options">
                <a-dropdown>
                    <a class="ant-dropdown-link" @click.prevent>
                        <MoreOutlined class="more-options-icon" />
                    </a>
                    <template #overlay>
                        <div class="wallet__options">
                            <div key="copy-address" class="wallet__options-item" @click.stop="() => handleOnCopyAddress(wallet.ecosystem)">
                                <div class="wallet__options-item-icon copy">
                                    <CopyIcon />
                                </div>
                                <div>{{ copied ? $t('adapter.copied') : $t('adapter.copyAddress') }}</div>
                            </div>

                            <div
                                key="disconnect-account"
                                class="wallet__options-item"
                                @click="() => handleOnDisconnectAccount(wallet.ecosystem, wallet)"
                            >
                                <div class="wallet__options-item-icon disconnect">
                                    <DisconnectIcon />
                                </div>
                                <div class="wallet__options-item-label disconnect">{{ $t('adapter.disconnectAccount') }}</div>
                            </div>
                        </div>
                    </template>
                </a-dropdown>
            </div>
        </div>
    </div>
</template>

<script>
import { computed, ref, watch } from 'vue';

import { useClipboard } from '@vueuse/core';

import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';

import ModuleIcon from '@/core/wallet-adapter/UI/Entities/ModuleIcon.vue';

import DisconnectIcon from '@/assets/icons/form-icons/clear.svg';
import CopyIcon from '@/assets/icons/platform-icons/copy.svg';
import CheckIcon from '@/assets/icons/form-icons/check-circle.svg';

import { MoreOutlined } from '@ant-design/icons-vue';

import { ECOSYSTEMS } from '@/core/wallet-adapter/config';

import { cutAddress } from '@/shared/utils/address';

export default {
    name: 'ConnectedWallet',
    components: {
        DisconnectIcon,
        CopyIcon,
        MoreOutlined,
        ModuleIcon,
        CheckIcon,
    },
    props: {
        wallet: {
            type: Object,
            required: true,
        },
    },
    setup(props) {
        const selectedChain = ref(props.wallet.chain);
        const { copy, copied } = useClipboard();
        const {
            getChainListByEcosystem,
            getChainByChainId,
            setNewChain,
            connectTo,
            disconnectWallet,
            action,
            connectedWallet,
            currentChainInfo,
        } = useAdapter(this);

        const chainList = computed(() => getChainListByEcosystem(props.wallet.ecosystem));
        const chainInfo = computed(() => getChainByChainId(props.wallet.ecosystem, selectedChain.value));

        watch(currentChainInfo, () => {
            if (props.wallet.ecosystem === ECOSYSTEMS.EVM && currentChainInfo.value?.ecosystem === ECOSYSTEMS.EVM)
                selectedChain.value = currentChainInfo.value.chain_id;
        });

        const handleSelectedChainChange = async () => {
            const newChain = selectedChain.value;
            const oldChain = props.wallet.chain;

            if (newChain === oldChain) return;

            const chainInfo = {
                chain: newChain,
                walletName: props.wallet.walletModule,
            };

            try {
                const changed = await setNewChain(props.wallet.ecosystem, chainInfo);

                if (!changed) selectedChain.value = oldChain;
            } catch (error) {
                console.error(error);
                await setNewChain(props.wallet.ecosystem, {
                    chain: oldChain,
                    walletName: props.wallet.walletModule,
                });
                selectedChain.value = oldChain;
            }
        };

        const handleOnClickConnectedWallet = async (wallet) => {
            const { account } = connectedWallet.value || {};
            if (wallet.account === account) return;

            action('SET_IS_CONNECTING', true);

            try {
                const status = await connectTo(wallet.ecosystem, wallet.walletModule);
                status && action('SET_IS_CONNECTING', false);
            } catch (error) {
                console.error(error);
                action('SET_IS_CONNECTING', false);
            }
        };

        const handleOnCopyAddress = (ecosystem) => {
            if (ecosystem === ECOSYSTEMS.EVM) return copy(props.wallet.address);

            action('SET_MODAL_ECOSYSTEM', ecosystem);
            return action('SET_MODAL_STATE', { name: 'addresses', isOpen: true });
        };

        const handleOnDisconnectAccount = async (ecosystem, wallet) => await disconnectWallet(ecosystem, wallet);

        return {
            chainInfo,
            chainList,
            selectedChain,
            currentChainInfo,
            copied,
            cutAddress,

            handleOnClickConnectedWallet,
            handleOnCopyAddress,
            handleOnDisconnectAccount,
            handleSelectedChainChange,
        };
    },
};
</script>

<style lang="scss">
.connected-wallet {
    @include pageFlexRow;
    justify-content: space-between;

    background: var(--#{$prefix}adapter-logo-main-color);
    border-radius: 50px;
    padding: 4px;

    cursor: pointer;

    height: 40px;

    font-size: var(--#{$prefix}small-lg-fs);

    transition: 0.2s;

    margin-top: 8px;

    border: 1px solid var(--#{$prefix}border-color-op-05);

    &:hover {
        border-color: var(--#{$prefix}border-color);
    }

    & > div {
        @include pageFlexRow;
        justify-content: center;

        .account-name {
            margin-left: 8px;
            color: var(--#{$prefix}adapter-value-text);
        }

        .change-network {
            @include pageFlexRow;
            justify-content: flex-end;

            border: 1px solid var(--#{$prefix}adapter-border-color);
            border-radius: 16px;

            &-logo {
                width: 32px;
                height: 32px;
                border-radius: 50%;

                img {
                    width: 100%;
                    height: 100%;
                    border-radius: inherit;
                }
            }
        }
    }
}

.more-options {
    & > a {
        height: min-content;
        display: flex;
        align-items: center;
    }
    &-icon {
        color: var(--#{$prefix}adapter-more-option);
        font-size: 20px;
    }
}

.wallet__options {
    background: var(--#{$prefix}main-background) !important;
    width: 180px;

    border: 1px solid var(--#{$prefix}border-color);
    border-radius: 4px;

    color: var(--#{$prefix}primary-text);
    font-size: var(--#{$prefix}small-lg-fs);
    font-weight: 400;

    &-item {
        @include pageFlexRow;

        cursor: pointer;

        padding: 12px 16px;
        transition: 0.2s;

        &-icon {
            @include pageFlexRow;
            justify-content: center;

            width: 24px;
            height: 24px;
            border-radius: 50%;

            margin-right: 8px;

            &.copy {
                background: var(--#{$prefix}adapter-not-connected-bg);

                svg {
                    width: 12px;
                    height: 12px;
                }
            }

            &.disconnect {
                background: var(--#{$prefix}danger-op-01);

                svg {
                    width: 16px;
                    height: 16px;
                }
            }
        }

        &-label {
            &.disconnect {
                color: var(--#{$prefix}danger) !important;
            }
        }

        &:not(:last-child) {
            margin-bottom: 4px;
        }

        &:hover {
            background: var(--#{$prefix}adapter-logo-main-color);
            border-radius: 4px;
        }
    }
}

.module-logo-container {
    position: relative;

    .check-icon {
        transform: scale(1.1);
        position: absolute;
        right: -2px;
        bottom: -2px;
    }
}
</style>
