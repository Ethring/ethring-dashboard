<template>
    <KeepAlive>
        <a-config-provider>
            <AppLayout />
            <WalletsModal />
            <AddressModal />
            <BridgeDexRoutesModal />
            <KadoModal />
            <SelectModal />
            <ReleaseNotes />
        </a-config-provider>
    </KeepAlive>
</template>
<script>
import { onMounted, watch, computed, inject, onBeforeMount, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';

import _ from 'lodash';

import Socket from '@/app/modules/socket';

import AppLayout from '@/app/layouts/DefaultLayout';
import ReleaseNotes from '@/app/layouts/DefaultLayout/header/ReleaseNotes.vue';

import WalletsModal from '@/core/wallet-adapter/UI/Modal/WalletsModal';
import AddressModal from '@/core/wallet-adapter/UI/Modal/AddressModal';
import KadoModal from '@/components/app/modals/KadoModal.vue';
import SelectModal from '@/components/app/modals/SelectModal.vue';
import BridgeDexRoutesModal from '@/components/app/modals/BridgeDexRoutesModal.vue';
import { callTrackEvent, identify } from '@/app/modules/mixpanel/track';

import { updateBalanceForAccount } from '@/core/balance-provider';

import { trackingBalanceUpdate } from '@/services/track-update-balance';
import { setNativeTokensPrices } from '@/core/balance-provider/native-token';

import { DP_CHAINS } from '@/core/balance-provider/models/enums';
import { ECOSYSTEMS } from '@/core/wallet-adapter/config';

export default {
    name: 'App',
    components: {
        AppLayout,
        KadoModal,
        SelectModal,
        BridgeDexRoutesModal,
        ReleaseNotes,
        WalletsModal,
        AddressModal,
    },

    setup() {
        const useAdapter = inject('useAdapter');
        const store = useStore();
        const mixpanel = inject('mixpanel');

        const isConfigLoading = computed(() => store.getters['configs/isConfigLoading']);

        const {
            initAdapter,
            walletAddress,
            walletAccount,
            currentChainInfo,
            connectedWallets,
            connectLastConnectedWallet,
            getAddressesWithChainsByEcosystem,
        } = useAdapter();

        const isShowRoutesModal = computed(() => store.getters['app/modal']('routesModal'));

        const getAddressesWithChains = async (ecosystem) => {
            const chainAddresses = await getAddressesWithChainsByEcosystem(ecosystem);

            return _.pick(chainAddresses, Object.values(DP_CHAINS)) || {};
        };

        const callSubscription = async () => {
            const { ecosystem } = currentChainInfo.value || {};

            if (JSON.stringify(await getAddressesWithChains(ecosystem)) !== '{}' && walletAddress.value) {
                Socket.setAddresses(await getAddressesWithChains(ecosystem), ecosystem, {
                    walletAccount: walletAccount.value,
                });

                identify(mixpanel, walletAddress.value);
                callTrackEvent(mixpanel, 'connect-wallet', {
                    Ecosystem: currentChainInfo.value.ecosystem,
                    WalletProvider: currentChainInfo.value.walletModule,
                    WalletProviderAccount: walletAccount.value,
                });
            }
        };

        const updateBalanceForAllAccounts = async () => {
            for (const wallet of connectedWallets.value) {
                // ?Skip if wallet is undefined or null
                if (!wallet) continue;

                const { account, ecosystem, addresses } = wallet || {};
                const list = _.pick(addresses, Object.values(DP_CHAINS)) || {};

                store.dispatch('adapters/SET_ADDRESSES_BY_ECOSYSTEM_LIST', { ecosystem, addresses: list });

                // * Calling update balance for each account
                await updateBalanceForAccount(account, list);
            }
        };

        const callInit = async () => {
            const { ecosystem, walletModule } = currentChainInfo.value || {};

            if (!walletModule || !ecosystem || !walletAddress.value || isShowRoutesModal.value) {
                store.dispatch('tokens/setLoader', false);
                return setTimeout(callInit, 1000);
            }

            const addressHash = (await getAddressesWithChainsByEcosystem(ecosystem, { hash: true })) || {};
            store.dispatch('adapters/SET_ADDRESSES_BY_ECOSYSTEM', { ecosystem, addresses: addressHash });

            await updateBalanceForAllAccounts();
        };

        // ==========================================================================================

        const unWatchAcc = watch(walletAccount, async () => {
            store.dispatch('tokens/setLoader', true);
            store.dispatch('tokens/setTargetAccount', walletAccount.value);
            callSubscription();
            setTimeout(callInit, 1000);
        });

        const unWatchLoading = watch(isConfigLoading, async () => {
            if (!isConfigLoading.value) await connectLastConnectedWallet();
        });

        // ==========================================================================================

        onBeforeMount(async () => {
            await store.dispatch('configs/setConfigLoading', true);

            await store.dispatch('configs/initConfigs');
            await store.dispatch('bridgeDexAPI/getServices');

            await initAdapter();

            await setNativeTokensPrices(store, ECOSYSTEMS.EVM);
            await setNativeTokensPrices(store, ECOSYSTEMS.COSMOS);
        });

        onBeforeUnmount(() => {
            // Stop watching
            unWatchAcc();
            unWatchLoading();
        });

        // ==========================================================================================
        // * Tracking balance update for all accounts
        onMounted(() => {
            // * Tracking balance update for all accounts
            trackingBalanceUpdate(store);
            // if (process.env.NODE_ENV === 'development') {
            //     import('@/app/scripts/development').then(({ default: dev }) => dev());
            // }
            // console.log('App mounted', store.getters['adapters/getAllConnectedWallets']);
        });
    },
};
</script>
