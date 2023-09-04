<template>
    <a-menu-divider class="divider" />

    <a-menu-item-group key="accounts" :title="$t('adapter.accountsGroup')" class="connected-wallets-container">
        <a-menu-item v-for="account in connectedWallets" :key="account">
            <ConnectedWallet :wallet="account" @open-addresses="handleOpenAddresses" />
        </a-menu-item>
    </a-menu-item-group>

    <a-menu-divider class="divider" />

    <a-menu-item>
        <DisconnectAll :disconnect-all="disconnectAll" />
    </a-menu-item>

    <a-modal
        v-model:open="accountsModal"
        :title="$t('adapter.accountModalTitle')"
        centered
        :footer="null"
        width="720px"
        :bodyStyle="{ height: '500px', overflowY: 'overlay' }"
    >
        <ChainWithAddress v-if="addressesWithChains" :chainWithAddress="addressesWithChains" :chainList="chainList" />
    </a-modal>
</template>

<script>
import { ref } from 'vue';

import useAdapter from '@/Adapter/compositions/useAdapter';

import ConnectedWallet from '@/Adapter/UI/Widgets/ConnectedWallet';

import DisconnectAll from '@/Adapter/UI/Entities/DisconnectAll';
import ChainWithAddress from '@/Adapter/UI/Entities/ChainWithAddress';

export default {
    name: 'AdapterDropdown',
    components: {
        DisconnectAll,
        ConnectedWallet,
        ChainWithAddress,
    },
    setup() {
        const accountsModal = ref(false);

        const addressesWithChains = ref([]);
        const chainList = ref([]);

        const { disconnectAllWallets, getAddressesWithChainsByEcosystem, getChainListByEcosystem, connectedWallets = [] } = useAdapter();

        const disconnectAll = async () => await disconnectAllWallets();

        const handleOpenAddresses = (ecosystem) => {
            accountsModal.value = true;
            addressesWithChains.value = getAddressesWithChainsByEcosystem(ecosystem);
            chainList.value = getChainListByEcosystem(ecosystem);
        };

        return {
            accountsModal,
            connectedWallets,

            addressesWithChains,
            chainList,

            disconnectAll,
            handleOpenAddresses,
        };
    },
};
</script>
