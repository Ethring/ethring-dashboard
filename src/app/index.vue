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

import { pick } from 'lodash';

import Socket from '@/app/modules/socket';

import AppLayout from '@/app/layouts/DefaultLayout';
import ReleaseNotes from '@/app/layouts/DefaultLayout/header/ReleaseNotes.vue';

import WalletsModal from '@/core/wallet-adapter/UI/Modal/WalletsModal';
import AddressModal from '@/core/wallet-adapter/UI/Modal/AddressModal';
import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';

import KadoModal from '@/components/app/modals/KadoModal.vue';
import SelectModal from '@/components/app/modals/SelectModal.vue';
import BridgeDexRoutesModal from '@/components/app/modals/BridgeDexRoutesModal.vue';
import { callTrackEvent, identify } from '@/app/modules/mixpanel/track';

import { updateBalanceForAccount } from '@/core/balance-provider';

import { trackingBalanceUpdate } from '@/services/track-update-balance';
import { setNativeTokensPrices } from '@/core/balance-provider/native-token';

import { DP_CHAINS } from '@/core/balance-provider/models/enums';
import { Ecosystem } from '@/shared/models/enums/ecosystems.enum';
import { delay } from '@/shared/utils/helpers';
import { Providers } from '../core/balance-provider/models/enums';

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
        const store = useStore();
        const mixpanel = inject('mixpanel');

        const isConfigLoading = computed(() => store.getters['configs/isConfigLoading']);

        const {
            initAdapter,
            walletAddress,
            walletAccount,
            currentChainInfo,
            connectedWallets,
            getDefaultAddress,
            connectLastConnectedWallet,
            getAddressesWithChainsByEcosystem,
            getChainListByEcosystem,
        } = useAdapter();

        const connectedWalletsFromStore = computed(() => store.getters['adapters/getConnectedWallets']);

        const isShowRoutesModal = computed(() => store.getters['app/modal']('routesModal'));

        const getAddressesWithChains = async (ecosystem) => {
            const chainAddresses = await getAddressesWithChainsByEcosystem(ecosystem);

            return pick(chainAddresses, Object.values(DP_CHAINS)) || {};
        };

        const callSubscription = async () => {
            const { ecosystem } = currentChainInfo.value || {};

            console.log('getDefaultAddress()', getDefaultAddress());
            if (JSON.stringify(await getAddressesWithChains(ecosystem)) !== '{}' && getDefaultAddress()) {
                Socket.setAddresses(await getAddressesWithChains(ecosystem), ecosystem, {
                    walletAccount: walletAccount.value,
                });

                identify(mixpanel, getDefaultAddress());

                callTrackEvent(mixpanel, 'connect-wallet', {
                    Ecosystem: currentChainInfo.value.ecosystem,
                    WalletProvider: currentChainInfo.value.walletModule,
                });
            }
        };

        const updateBalanceForAllAccounts = async () => {
            await store.dispatch('tokens/setLoader', true);

            for (const wallet of connectedWallets.value) {
                // ?Skip if wallet is undefined or null
                if (!wallet) continue;

                const { account, ecosystem, addresses } = wallet || {};
                const list = pick(addresses, Object.values(DP_CHAINS)) || {};

                store.dispatch('adapters/SET_ADDRESSES_BY_ECOSYSTEM_LIST', { ecosystem, addresses: list });

                switch (ecosystem) {
                    case Ecosystem.EVM:
                        await updateBalanceForAccount(account, list, {
                            provider: Providers.GoldRush,
                            fetchIntegrations: false,
                            fetchNfts: false,
                            fetchTokens: true,
                        });

                        await updateBalanceForAccount(account, list, {
                            provider: Providers.Pulsar,
                            fetchTokens: false,
                            fetchIntegrations: true,
                            fetchNfts: true,
                        });

                        break;
                    case Ecosystem.COSMOS:
                        await updateBalanceForAccount(account, list, {
                            provider: Providers.Pulsar,
                            fetchTokens: true,
                            fetchIntegrations: true,
                            fetchNfts: true,
                        });

                        break;
                    default:
                        break;
                }
            }
        };

        const callInit = async () => {
            const { ecosystem, walletModule } = currentChainInfo.value || {};

            if (!walletModule || !ecosystem || !walletAddress.value || isShowRoutesModal.value) return setTimeout(callInit, 1000);

            const addressHash = (await getAddressesWithChainsByEcosystem(ecosystem, { hash: true })) || {};
            store.dispatch('adapters/SET_ADDRESSES_BY_ECOSYSTEM', { ecosystem, addresses: addressHash });

            await updateBalanceForAllAccounts();
        };

        // ==========================================================================================

        const onLoadWallets = async () => {
            await callSubscription();

            await delay(1000);

            await callInit();
        };

        const unWatchAcc = watch(walletAccount, async () => {
            store.dispatch('tokens/setTargetAccount', walletAccount.value);

            if (currentChainInfo.value?.ecosystem === Ecosystem.EVM) {
                store.dispatch('shortcuts/loadDebridgeInfo', walletAddress.value);
                store.dispatch('shortcuts/loadMitosisPoints', walletAddress.value);
                store.dispatch('shortcuts/loadUserVaults', walletAddress.value);
            }

            await onLoadWallets();
        });

        const unWatchLoading = watch(isConfigLoading, async () => {
            if (!isConfigLoading.value) await connectLastConnectedWallet();
        });

        // ==========================================================================================

        onBeforeMount(async () => {
            await store.dispatch('configs/setLastUpdated');

            await store.dispatch('configs/setConfigLoading', true);

            await store.dispatch('configs/initConfigs');
            await store.dispatch('bridgeDexAPI/getServices');

            await initAdapter();

            const EVM_NETS = getChainListByEcosystem(Ecosystem.EVM);
            const COSMOS_NETS = getChainListByEcosystem(Ecosystem.COSMOS);

            await Promise.all([setNativeTokensPrices(EVM_NETS), setNativeTokensPrices(COSMOS_NETS)]);

            const NETWORKS = [...getChainListByEcosystem(Ecosystem.EVM, true), ...getChainListByEcosystem(Ecosystem.COSMOS, true)];

            for (const network of NETWORKS)
                store.dispatch('tokens/setNetworksToShow', {
                    network: network.net,
                    isShow: network.isSupportedChain,
                });
        });

        onBeforeUnmount(() => {
            // Stop watching
            unWatchAcc();
            unWatchLoading();
        });

        // ==========================================================================================
        // * Tracking balance update for all accounts
        onMounted(async () => {
            // * Tracking balance update for all accounts
            trackingBalanceUpdate(store);
            onLoadWallets();
            // if (process.env.NODE_ENV === 'development') {
            //     import('@/app/scripts/development').then(({ default: dev }) => dev());
            // }
            // console.log('App mounted', store.getters['adapters/getAllConnectedWallets']);
        });
    },
};
</script>
