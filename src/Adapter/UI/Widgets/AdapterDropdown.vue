<template>
    <div class="adapter-dropdown">
        <div class="adapter-dropdown__header">
            <ConnectTo
                :name="$t('connect.ethereumWallets')"
                :connect="() => connect(ECOSYSTEMS.EVM)"
                :logos="['Metamask', 'Coinbase', 'Ledger']"
            />
            <ConnectTo
                :connect="() => connect(ECOSYSTEMS.COSMOS)"
                :name="$t('connect.cosmosWallets')"
                :logos="['Keplr', 'Leap', 'Ledger']"
            />
        </div>

        <div v-if="connectedWallets.length" class="adapter-dropdown__body">
            Connected wallets ({{ connectedWallets.length || 0 }})

            <a-collapse class="connected-wallets-group" expandIconPosition="end" :bordered="false">
                <a-collapse-panel :header="`${wallet} (${accounts.length})`" v-for="(accounts, wallet) in walletsGroup" :key="wallet">
                    <div class="connected-wallets-container">
                        <ConnectedWallet v-for="account in accounts" :key="account" :wallet="account" />
                    </div>
                </a-collapse-panel>
            </a-collapse>

            <!-- <div class="connected-wallets-container">
                <ConnectedWallet v-for="account in connectedWallets" :key="account" :wallet="account" />
            </div> -->
        </div>

        <div v-if="walletAddress && connectedWallets" class="adapter-dropdown__footer">
            <DisconnectAll :disconnect-all="disconnectAll" />
        </div>
    </div>
</template>

<script>
import { useStore } from 'vuex';

import useAdapter from '@/Adapter/compositions/useAdapter';

import ConnectTo from '@/Adapter/UI/Entities/ConnectTo';
import DisconnectAll from '@/Adapter/UI/Entities/DisconnectAll';

import ConnectedWallet from '@/Adapter/UI/Features/ConnectedWallet';

import { ECOSYSTEMS } from '@/Adapter/config';
import { computed } from 'vue';

export default {
    name: 'AdapterDropdown',
    components: {
        ConnectTo,
        DisconnectAll,
        ConnectedWallet,
    },
    emits: ['close-dropdown'],
    setup(_, { emit }) {
        const store = useStore();

        const { walletAddress, disconnectAllWallets, connectedWallets = [], connectTo } = useAdapter();

        const connect = async (ecosystem = ECOSYSTEMS.EVM) => {
            if (ecosystem === ECOSYSTEMS.COSMOS) {
                store.dispatch('adapter/open');
                return;
            }

            const status = await connectTo(ecosystem);

            if (status) {
                emit('close-dropdown');
            }
        };

        const disconnectAll = async () => {
            await disconnectAllWallets();
            emit('close-dropdown');
        };

        const walletsGroup = computed(() => {
            const groupedData = {};
            const key = 'walletName';
            for (const wallet of connectedWallets.value) {
                const value = wallet[key];

                if (!groupedData[value]) {
                    groupedData[value] = [];
                }

                groupedData[value].push(wallet);
            }

            return groupedData;
        });

        return {
            ECOSYSTEMS,
            walletAddress,
            connectedWallets,
            walletsGroup,
            connect,
            disconnectAll,
        };
    },
};
</script>
<style lang="scss" scoped>
.adapter-dropdown {
    max-width: 450px;
    min-width: 400px;
    width: 100%;
    box-shadow: 0px 4px 40px 0px #00000033;
    border-radius: 16px;
    padding: 16px;
    position: absolute;
    top: 60px;
    left: -7%;
    z-index: 999;
    background: #fff;

    &::after {
        content: '';
        position: absolute;
        top: -24px;
        left: 45%;

        border-width: 13px;
        border-style: solid;
        border-color: transparent transparent white transparent;
    }

    & > div:not(:last-child) {
        margin-bottom: 20px;
    }

    .connected-wallets {
        &-group {
            margin-top: 10px;
            border: 1px solid #c9e0e0;
            background-color: transparent;
            .ant-collapse-item {
                border-bottom-color: #c9e0e0;
            }
        }
        &-container {
            max-height: 320px;
            overflow: auto;
            & > div {
                margin-top: 10px;
            }
        }
    }
}
</style>
