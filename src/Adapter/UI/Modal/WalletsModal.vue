<template>
    <teleport to="body">
        <div class="wallets-modal" :class="{ active: isOpen }" @click="close" id="wallet-modal-overview">
            <div class="wallets-modal__body">
                <div class="top">
                    <div>Available wallets</div>
                    <div class="close" @click="(event) => close(event, true)">X</div>
                </div>
                <div class="content" v-if="isOpen">
                    <!-- <a-select
                        show-search
                        v-model:value="selectedChain"
                        placeholder="Select chain for connect"
                        option-label-prop="children"
                        class="content-chain"
                    >
                        <a-select-option v-for="chain in chainList" :key="chain.chain_id" :value="chain.chain_id">
                            <ChainRecord :chain="chain" />
                        </a-select-option>
                    </a-select> -->
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
// import ChainRecord from '@/Adapter/UI/Entities/ChainRecord';

import { ECOSYSTEMS } from '@/Adapter/config';

export default {
    name: 'WalletsModal',
    components: {
        WalletItem,
        // ChainRecord,
    },
    setup() {
        const store = useStore();
        const selectedChain = ref('cosmoshub');

        const isOpen = computed(() => store.getters['adapters/isOpen']);

        const close = (e, closeBtn = false) => {
            const modal = document.getElementById('wallet-modal-overview');

            if (e.target === modal || closeBtn) {
                store.dispatch('adapters/SET_MODAL_STATE', false);
            }
        };

        const { connectTo, getChainListByEcosystem, getWalletsModuleByEcosystem } = useAdapter();

        const chainList = computed(() => getChainListByEcosystem(ECOSYSTEMS.COSMOS));

        const connect = async (wallet) => {
            const status = await connectTo(ECOSYSTEMS.COSMOS, wallet, selectedChain.value);

            status && store.dispatch('adapters/SET_MODAL_STATE', false);
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

            &-chain {
                margin-bottom: 16px;
                width: 100%;

                .ant-select-selector {
                    border-color: #d0d4f7;
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
