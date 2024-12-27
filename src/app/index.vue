<template>
    <a-config-provider>
        <AppLayout />
        <WalletsModal />
        <AddressModal />
        <BridgeDexRoutesModal />
        <SelectModal />
        <OperationBag />
    </a-config-provider>
</template>
<script>
import { onMounted, watch, computed, inject, onBeforeMount, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';

import Socket from '@/app/modules/socket';
import SocketDataProvider from '@/core/balance-provider/socket';

import AppLayout from '@/app/layouts/AppLayout';

import WalletsModal from '@/core/wallet-adapter/UI/Modal/WalletsModal';
import AddressModal from '@/core/wallet-adapter/UI/Modal/AddressModal';
import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';
import OperationBag from '@/core/operations/UI/OperationBag';

import SelectModal from '@/components/app/modals/SelectModal.vue';
import BridgeDexRoutesModal from '@/components/app/modals/BridgeDexRoutesModal.vue';
import { callTrackEvent, identify } from '@/app/modules/mixpanel/track';

import { updateBalanceForAccount } from '@/core/balance-provider';

import { trackingBalanceUpdate } from '@/services/track-update-balance';
import { setNativeTokensPrices } from '@/core/balance-provider/native-token';

import { Ecosystem } from '@/shared/models/enums/ecosystems.enum';
import { delay } from '@/shared/utils/helpers';
import { Providers, Type } from '../core/balance-provider/models/enums';

export default {
    name: 'App',
    components: {
        AppLayout,
        SelectModal,
        BridgeDexRoutesModal,
        WalletsModal,
        OperationBag,
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

        const isShowRoutesModal = computed(() => store.getters['app/modal']('routesModal'));

        const callSubscription = async () => {
            const { ecosystem } = currentChainInfo.value || {};

            if (JSON.stringify(await getAddressesWithChainsByEcosystem(ecosystem)) !== '{}' && getDefaultAddress()) {
                Socket.setAddresses(await getAddressesWithChainsByEcosystem(ecosystem), ecosystem, {
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
            try {
                await store.dispatch('tokens/setLoader', true);

                for (const wallet of connectedWallets.value) {
                    // ?Skip if wallet is undefined or null
                    if (!wallet) continue;

                    const { account, ecosystem, addresses } = wallet || {};

                    store.dispatch('adapters/SET_ADDRESSES_BY_ECOSYSTEM_LIST', { ecosystem, addresses });

                    // * Load balances from IndexedDB cache
                    for (const chain in addresses) {
                        const { address } = addresses[chain];
                        for (const type in Type) await store.dispatch('tokens/loadFromCache', { account, chain, address, type });
                    }

                    switch (ecosystem) {
                        case Ecosystem.EVM:
                            SocketDataProvider.subscribeToAddress(Providers.GoldRush, account, addresses);
                            await SocketDataProvider.updateBalance(account);

                            break;
                        case Ecosystem.COSMOS:
                            await updateBalanceForAccount(account, addresses, {
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
            } catch (error) {
                console.error('Error while updating balance for all accounts', error);
            } finally {
                await store.dispatch('tokens/setLoader', false);
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

        const unWatchAcc = watch(
            walletAccount,
            async (walletAccount, oldWalletAccount) => {
                if (oldWalletAccount) SocketDataProvider.stopUpdateBalance(oldWalletAccount);

                if (walletAccount) {
                    store.dispatch('tokens/setTargetAccount', walletAccount);
                    await onLoadWallets();
                }
            },
            { immediate: true },
        );

        const unWatchLoading = watch(isConfigLoading, async () => {
            if (!isConfigLoading.value) await connectLastConnectedWallet();
        });

        // ==========================================================================================

        onBeforeMount(async () => {
            await store.dispatch('configs/setLastUpdated');
            await store.dispatch('configs/setStakeTokens');

            await store.dispatch('configs/setConfigLoading', true);

            await Promise.all([store.dispatch('configs/initConfigs'), store.dispatch('bridgeDexAPI/getServices')]);

            await initAdapter();

            const EVM_NETS = getChainListByEcosystem(Ecosystem.EVM);
            const COSMOS_NETS = getChainListByEcosystem(Ecosystem.COSMOS);

            await Promise.all([setNativeTokensPrices(EVM_NETS), setNativeTokensPrices(COSMOS_NETS)]);

            // TODO: Uncomment this code when we need to show all networks
            // for (const network of [...getChainListByEcosystem(Ecosystem.EVM, true), ...getChainListByEcosystem(Ecosystem.COSMOS, true)])
            //     store.dispatch('tokens/setNetworksToShow', {
            //         network: network.net,
            //         isShow: network.isSupportedChain,
            //     });
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
            // if (process.env.NODE_ENV === 'development') {
            //     import('@/app/scripts/development').then(({ default: dev }) => dev());
            // }
            // console.log('App mounted', store.getters['adapters/getAllConnectedWallets']);
        });
    },
};
</script>
