<template>
    <div class="connected-wallet" @click="handleOnClickConnectedWallet(wallet)">
        <div class="left-side">
            <ModuleIcon :ecosystem="wallet.ecosystem" :module="wallet.walletModule" />
            <div class="account-name">
                {{ cutAddress(wallet.account, 10, 4) }}
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

            <div class="more-options">
                <a-dropdown>
                    <a class="ant-dropdown-link" @click.prevent>
                        <MoreOutlined />
                    </a>
                    <template #overlay>
                        <a-menu>
                            <a-menu-item key="copy-address" @click="() => handleOnCopyAddress(wallet.ecosystem)">
                                <CopyOutlined />
                                {{ $t('adapter.copyAddress') }}
                            </a-menu-item>

                            <a-menu-item key="disconnect-account" @click="handleOnDisconnectAccount">
                                <DisconnectOutlined />
                                {{ $t('adapter.disconnectAccount') }}
                            </a-menu-item>
                        </a-menu>
                    </template>
                </a-dropdown>
            </div>
        </div>
    </div>
</template>

<script>
import { computed, ref, watch } from 'vue';
import { MoreOutlined, CopyOutlined, DisconnectOutlined } from '@ant-design/icons-vue';

import useAdapter from '@/Adapter/compositions/useAdapter';

import ModuleIcon from '@/Adapter/UI/Entities/ModuleIcon.vue';

import { cutAddress } from '@/helpers/utils';

export default {
    name: 'ConnectedWallet',
    components: {
        ModuleIcon,
        MoreOutlined,
        CopyOutlined,
        DisconnectOutlined,
    },
    props: {
        wallet: {
            type: Object,
            required: true,
        },
    },
    emits: ['open-addresses'],
    setup(props, { emit }) {
        const selectedChain = ref(props.wallet.chain);

        const { getChainListByEcosystem, getChainByChainId, setNewChain, connectTo, disconnectWallet, action, connectedWallet } =
            useAdapter();

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

        const handleOnClickConnectedWallet = async (wallet) => {
            const { account } = connectedWallet.value || {};
            if (wallet.account === account) {
                return;
            }

            action('SET_IS_CONNECTING', true);

            try {
                const status = await connectTo(wallet.ecosystem, wallet.walletModule);
                status && action('SET_IS_CONNECTING', false);
            } catch (error) {
                console.error(error);
                action('SET_IS_CONNECTING', false);
            }
        };

        const handleOnCopyAddress = (ecosystem) => emit('open-addresses', ecosystem);

        const handleOnDisconnectAccount = async () => await disconnectWallet(props.wallet.ecosystem, props.wallet);

        return {
            chainInfo,
            chainList,
            selectedChain,

            cutAddress,

            handleOnClickConnectedWallet,
            handleOnCopyAddress,
            handleOnDisconnectAccount,
        };
    },
};
</script>

<style lang="scss" scoped>
.connected-wallet {
    border: 1px solid #d9f4f1;
    border-radius: 16px;
    padding: 8px;
    cursor: pointer;
    max-height: 48px;

    font-size: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    transition: 0.2s;

    &:hover {
        background-color: #fff;
    }

    & > div {
        display: flex;
        align-items: center;
        justify-content: center;

        .account-name {
            margin-left: 8px;
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
.more-options {
    margin-left: 8px;
}
</style>
