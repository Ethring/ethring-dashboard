<template>
    <teleport to="body">
        <div class="wallets-modal" :class="{ active: isOpen }" @click="close" id="wallet-modal-overview">
            <div class="wallets-modal__body">
                <div class="top">
                    <div>{{ $t('connect.availableWallets') }}</div>
                    <div class="close" @click="(event) => close(event, true)">
                        <CloseIcon />
                    </div>
                </div>
                <div class="content" v-if="isOpen">
                    <div class="content-wallets">
                        <WalletItem
                            v-for="wallet in getWalletsModuleByEcosystem(ecosystem)"
                            :key="wallet"
                            :wallet="wallet"
                            :connect="connect"
                        />
                    </div>
                </div>
            </div>
        </div>
    </teleport>
</template>
<script>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';

import useAdapter from '@/Adapter/compositions/useAdapter';

import WalletItem from '@/Adapter/UI/Entities/WalletItem';

import { ECOSYSTEMS } from '@/Adapter/config';

import CloseIcon from '@/assets/icons/dashboard/close.svg';

export default {
    name: 'WalletsModal',
    components: {
        WalletItem,
        CloseIcon,
    },
    setup() {
        const store = useStore();
        const selectedChain = ref('cosmoshub');

        const isOpen = computed(() => store.getters['adapters/isOpen']('wallets'));

        const { connectTo, getChainListByEcosystem, getWalletsModuleByEcosystem, action } = useAdapter();

        const close = (e, closeBtn = false) => {
            const modal = document.getElementById('wallet-modal-overview');

            if (e.target === modal || closeBtn) {
                return action('SET_MODAL_STATE', { name: 'wallets', isOpen: false });
            }
        };

        const chainList = computed(() => getChainListByEcosystem(ECOSYSTEMS.COSMOS));

        const connect = async (wallet) => {
            const status = await connectTo(ECOSYSTEMS.COSMOS, wallet, selectedChain.value);

            status && action('SET_MODAL_STATE', { name: 'wallets', isOpen: false });
        };

        return {
            isOpen,
            chainList,
            selectedChain,
            ecosystem: ECOSYSTEMS.COSMOS,
            getWalletsModuleByEcosystem,

            close,
            connect,
        };
    },
};
</script>
<style lang="scss" scoped>
.wallets-modal {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    top: 100vh;

    z-index: -999;
    opacity: 0;

    transition: opacity 250ms ease-in;

    background-color: rgba(0, 0, 0, 0.6);
    color: var(--#{$prefix}primary-text);

    @include pageFlexRow;
    justify-content: center;

    &.active {
        top: 0;

        z-index: 999;
        opacity: 1;
    }

    &__body {
        position: relative;
        z-index: 1000;

        min-width: 448px;
        min-height: 448px;
        margin: auto;
        border-radius: 16px;
        background-color: var(--#{$prefix}secondary-background);

        .top {
            @include pageFlexRow;
            justify-content: space-between;
            padding: 16px;
            border-bottom: 1px solid var(--#{$prefix}border-color-op-05);

            .close {
                @include pageFlexRow;
                justify-content: center;
                position: relative;
                overflow: hidden;
                height: 32px;
                width: 32px;
                border-radius: 50%;
                cursor: pointer;

                &::before {
                    content: '';
                    position: absolute;
                    height: inherit;
                    width: inherit;
                    opacity: 0.1;
                    background: var(--#{$prefix}adapter-modal-close-color);
                    transition: 300ms ease-in-out opacity;

                    &:hover {
                        opacity: 0.4;
                    }
                }

                svg {
                    opacity: 0.6;
                    cursor: pointer;
                    fill: var(--#{$prefix}adapter-modal-close-color);

                    &:hover {
                        opacity: 0.8;
                    }
                }
            }
        }

        .content {
            padding: 16px;

            &-chain {
                margin-bottom: 16px;
                width: 100%;

                .ant-select-selector {
                    border: 1px solid var(--#{$prefix}border-color-op-05);
                }
            }
            &-wallets {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 8px;
            }
        }
    }
}
</style>
