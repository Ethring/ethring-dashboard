<template>
    <teleport to="body">
        <div class="wallets-modal" :class="{ active: isOpen }" @click="close" id="wallet-modal-overview">
            <div class="wallets-modal__body">
                <div class="top">
                    <div>Available wallets ({{ count }})</div>
                    <div class="close" @click="(event) => close(event, true)">X</div>
                </div>
                <div class="content" v-if="isOpen">
                    <WalletItem v-for="wallet in walletsModule" :key="wallet" :wallet="wallet" :connect="connect" />
                </div>
            </div>
        </div>
    </teleport>
</template>
<script>
import { computed, watch } from 'vue';
import { useStore } from 'vuex';

import useAdapter from '@/Adapter/compositions/useAdapter';

import WalletItem from '@/Adapter/UI/Modal/WalletItem';
import { ECOSYSTEMS } from '@/Adapter/config';

export default {
    name: 'WalletsModal',
    components: {
        WalletItem,
    },
    setup() {
        const store = useStore();
        const isOpen = computed(() => store.getters['adapter/isOpen']);

        const close = (e, closeBtn = false) => {
            const modal = document.getElementById('wallet-modal-overview');

            if (e.target === modal || closeBtn) {
                store.dispatch('adapter/close');
            }
        };

        const { connectTo, walletsModule, getWalletsModule } = useAdapter();

        const count = computed(() => (walletsModule.value ? walletsModule.value.length : 0));

        const connect = async (wallet) => {
            const result = await connectTo(ECOSYSTEMS.COSMOS, wallet);

            if (!result) {
                return;
            }

            store.dispatch('adapter/close');
        };

        watch(isOpen, () => {
            if (isOpen.value) {
                getWalletsModule(ECOSYSTEMS.COSMOS);
            }
        });

        return {
            isOpen,
            count,
            walletsModule,

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

    display: flex;
    align-items: center;
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
        background-color: #fff;

        .top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px;
            border-bottom: 1px solid #d0d4f7;

            .close {
                cursor: pointer;
            }
        }

        .content {
            padding: 16px;

            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            .wallet-record {
                cursor: pointer;
                flex: 1 45%;
                display: flex;
                align-items: center;
                border: 1px solid #d0d4f7;
                border-radius: 16px;
                gap: 16px;
                padding: 16px;

                max-height: 80px;

                transition: background-color 250ms ease-in-out;

                &:hover {
                    background-color: #eff1fc;
                }

                .icon {
                    width: 48px;
                    height: 48px;

                    display: flex;
                    align-items: center;
                    justify-content: center;

                    border: 1px solid #d0d4f7;
                    border-radius: 12px;
                    img {
                        width: 30px;
                        height: 30px;
                    }
                }
            }
        }
    }
}
</style>
