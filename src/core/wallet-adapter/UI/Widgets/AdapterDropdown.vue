<template>
    <div key="accounts" class="connected-wallets">
        <div class="connected-wallets__header">
            <WalletIcon />
            <p class="connected-wallets-label">
                {{ cutAddress(walletAccount) }}
            </p>
        </div>

        <a-divider class="divider" />
        <div class="connected-wallets__item" @click="disconnectAll">
            <div class="connected-wallets__item-icon">
                <LogOutIcon />
            </div>
            <span>Logout</span>
        </div>
    </div>
</template>

<script>
import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';
import { cutAddress } from '@/shared/utils/address';
import WalletIcon from '@/assets/icons/wallets/wallet.svg';

import LogOutIcon from '@/assets/icons/wallets/log-out.svg';

export default {
    name: 'AdapterDropdown',
    components: {
        WalletIcon,
        LogOutIcon,
    },
    setup() {
        const { walletAccount, disconnectAllWallets, connectedWallets = [] } = useAdapter();

        return {
            walletAccount,

            cutAddress,

            connectedWallets,

            disconnectAll: disconnectAllWallets,
        };
    },
};
</script>
