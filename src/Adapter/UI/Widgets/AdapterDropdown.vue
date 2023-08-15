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
            <div class="connected-wallets-container">
                <ConnectedWallet v-for="wallet in connectedWallets" :key="wallet" :wallet="wallet" />
            </div>
        </div>

        <div v-if="walletAddress" class="adapter-dropdown__footer">
            <DisconnectAll :disconnect-all="disconnectAll" />
        </div>
    </div>
</template>

<script>
import { useStore } from 'vuex';

import useAdapter from '@/compositions/useAdapter';

import ConnectTo from '@/Adapter/UI/Features/ConnectTo';
import ConnectedWallet from '@/Adapter/UI/Features/ConnectedWallet';
import DisconnectAll from '@/Adapter/UI/Features/DisconnectAll';

import { ECOSYSTEMS } from '@/Adapter/config';

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

            await connectTo(ecosystem);
            emit('close-dropdown');
        };

        const disconnectAll = async (ecosystem = ECOSYSTEMS.EVM) => {
            console.log('disconnectAll', ecosystem);
            await disconnectAllWallets();
            emit('close-dropdown');
        };

        return {
            ECOSYSTEMS,
            walletAddress,
            connectedWallets,

            connect,
            disconnectAll,
        };
    },
};
</script>
<style lang="scss" scoped>
.adapter-dropdown {
    box-shadow: 0px 4px 40px 0px #00000033;
    border-radius: 16px;
    padding: 16px;
    position: absolute;
    top: 60px;
    left: -5%;
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

    .connected-wallets-container > div {
        margin-top: 10px;
    }
}
</style>
