import { createStore, Store } from 'vuex';

import { chainListMock, tokensList } from '../../mocks/compositions/index';

import appStore from '../../../../src/store/app';
import operationsStore from '../../../../src/store/operations/index';
import configStore from '../../../../src/store/configs/index';
import tokensStore from '../../../../src/store/tokens';
import adapterStore from '../../../../src/core/wallet-adapter/store/index';
import shortcutStore from '../../../../src/core/shortcuts/store';

export function createTestStore() {
    return createStore({
        state: {},
        mutations: {},
        actions: {},
        getters: {},
        modules: {
            app: appStore,
            adapters: adapterStore,
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
        },
    });
}
