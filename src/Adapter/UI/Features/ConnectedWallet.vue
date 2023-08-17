<template>
    <div class="connected-wallet">
        <div class="left-side">
            <div class="icon-container">
                {{ wallet.walletName }}
            </div>
            <div class="">
                {{ cutAddress(wallet.address, 10, 4) }}
            </div>
        </div>

        <div class="right-side">
            <div class="change-network">
                <div class="change-network-logo">
                    <img :src="chainInfo.logo" alt="current-chain-logo" />
                </div>
                <select v-model="selectedChain">
                    <option v-for="chain in chainList" :key="chain" :selected="chain.chain_id === wallet.chain" :value="chain.chain_id">
                        {{ chain.name }}
                    </option>
                </select>
            </div>
            <div></div>
        </div>
    </div>
</template>

<script>
import useAdapter from '@/Adapter/compositions/useAdapter';

import { cutAddress } from '@/helpers/utils';
import { computed, ref, watch } from 'vue';

export default {
    name: 'ConnectedWallet',
    components: {},
    props: {
        wallet: {
            type: Object,
            required: true,
        },
    },
    setup(props) {
        const selectedChain = ref(props.wallet.chain);

        const { getChainListByEcosystem, getChainByChainId, setNewChain } = useAdapter();

        const chainList = computed(() => getChainListByEcosystem(props.wallet.ecosystem));
        const chainInfo = computed(() => getChainByChainId(props.wallet.ecosystem, selectedChain.value));

        watch(selectedChain, async (newChain, oldChain) => {
            if (newChain === oldChain) {
                return;
            }

            const chainInfo = {
                chain: newChain,
                walletName: props.wallet.walletModule,
            };

            try {
                await setNewChain(props.wallet.ecosystem, chainInfo);
            } catch (error) {
                console.error(error);
                await setNewChain(props.wallet.ecosystem, {
                    chain: oldChain,
                    walletName: props.wallet.walletModule,
                });
                selectedChain.value = oldChain;
            }
        });

        return {
            cutAddress,
            chainInfo,
            chainList,
            selectedChain,
        };
    },
};
</script>

<style lang="scss" scoped>
.connected-wallet {
    border: 1px solid #d9f4f1;
    border-radius: 16px;
    padding: 8px 16px;
    cursor: pointer;
    max-height: 48px;

    font-size: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    & > div {
        display: flex;
        align-items: center;
        justify-content: center;

        .icon-container {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background-color: #d9f4f1;
            margin-right: 8px;

            display: flex;
            justify-content: center;
            align-items: center;

            font-size: 5px;
        }

        .change-network {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            border: 1px solid #d9f4f1;
            border-radius: 16px;

            &-logo {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                img {
                    width: 100%;
                    height: 100%;
                    border-radius: inherit;
                }
            }

            select {
                width: 100%;
                min-width: 80px;
                max-width: 80px;
                white-space: nowrap;
                text-overflow: ellipsis;
                border: none;
                background-color: transparent;
                font-size: 12px;
                font-weight: 500;
                outline: none;
                margin-right: 5px;
            }
        }
    }
}
</style>
