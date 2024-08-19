import { createStore, Store } from 'vuex';

import { chainListMock, tokensList, CONNECTED_WALLETS } from '../../mocks/compositions/index';

import appStore from '../../../../src/store/app';
import operationsStore from '../../../../src/store/operations/index';
import configStore from '../../../../src/store/configs/index';
import tokensStore from '../../../../src/store/tokens';
import moduleStatesStore from '../../../../src/store/moduleStates';

import txManagerStore from '../../../../src/core/transaction-manager/store';
import adapterStore from '../../../../src/core/wallet-adapter/store/index';
import shortcutStore from '../../../../src/core/shortcuts/store';
import bridgeDexAPIStore from '../../../../src/modules/bridge-dex/store';

export function createTestStore() {
    return createStore({
        state: {},
        mutations: {},
        actions: {},
        getters: {},
        modules: {
            app: appStore,
            adapters: {
                ...adapterStore,
                getters: {
                    ...adapterStore.getters,
                    getAddressesByEcosystem: (state: any) => (ecosystem: string) => {
                        if (!ecosystem) return [];
                        if (!CONNECTED_WALLETS.find((wallet) => wallet.ecosystem === ecosystem)) return [];
                        const wallet = CONNECTED_WALLETS.find((wallet) => wallet.ecosystem === ecosystem);
                        return wallet?.addresses;
                    },
                },
            },
            bridgeDexAPI: bridgeDexAPIStore,
            tokens: {
                ...tokensStore,
                getters: {
                    ...tokensStore.getters,
                    getTokensListForChain:
                        (state: any) =>
                        (net: string, { account }: { account: string }) => {
                            if (!net) return [];
                            if (!account) return [];
                            if (!tokensList.withBalance) return [];

                            const isEVM = account?.includes('EVM');
                            const isCosmos = account?.includes('COSMOS');

                            if (isEVM && tokensList.withBalance.evm[net]) return tokensList.withBalance.evm[net];
                            else if (isCosmos && tokensList.withBalance.cosmos[net]) return tokensList.withBalance.cosmos[net];

                            return [];
                        },
                },
            },
            configs: {
                ...configStore,
                getters: {
                    ...configStore.getters,
                    getConfigsListByEcosystem: (state: any) => (ecosystem: string) => {
                        if (!ecosystem) return [];
                        if (!chainListMock[ecosystem]) return [];
                        return chainListMock[ecosystem];
                    },

                    getTokensListForChain: (state: any) => (net: string) => {
                        if (!tokensList.withoutBalance[net]) return [];
                        return tokensList.withoutBalance[net];
                    },
                },
                actions: {
                    ...configStore.actions,
                    getTokensListForChain: async (context: any, net: string) => {
                        if (!tokensList.withoutBalance[net]) return [];
                        return tokensList.withoutBalance[net];
                    },
                },
            },
            tokenOps: operationsStore,
            shortcuts: shortcutStore,
            moduleStates: moduleStatesStore,
            txManager: txManagerStore,
        },
    });
}
