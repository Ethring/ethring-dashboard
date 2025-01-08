import { values } from 'lodash';

import { Ecosystem } from '@/shared/models/enums/ecosystems.enum';

import { getConfigsByEcosystems, getLastUpdated, getTokensConfigByChain, getStakeTokens } from '@/modules/chain-configs/api';

import ConfigsDB from '@/services/indexed-db/configs';

import { DP_CHAINS } from '@/core/balance-provider/models/enums';

const TYPES = {
    SET_CONFIG_LOADING: 'SET_CONFIG_LOADING',
    SET_CHAIN_CONFIG: 'SET_CHAIN_CONFIG',
    SET_LAST_UPDATED: 'SET_LAST_UPDATED',
    SET_STAKE_TOKENS: 'SET_STAKE_TOKENS',
};

export default {
    namespaced: true,

    state: () => ({
        isConfigLoading: true,

        chains: {
            [Ecosystem.EVM]: {},
            [Ecosystem.COSMOS]: {},
        },

        stakeTokens: {},

        lastUpdated: null,
    }),

    getters: {
        isConfigLoading: (state) => state.isConfigLoading,

        getConfigsByEcosystems: (state) => (ecosystem) => state.chains[ecosystem] || {},

        getConfigsListByEcosystem: (state) => (ecosystem) => values(state.chains[ecosystem]) || [],

        getChainConfigByChainId: (state) => (chainId, ecosystem) => {
            if (!state.chains[ecosystem]) return {};

            const chainList = values(state.chains[ecosystem]);

            let cId = chainId;

            if (typeof chainId === 'string' && chainId.startsWith('0x')) cId = parseInt(chainId, 16);

            const chain = chainList.find((chain) => chain.chain_id === cId);

            return chain || {};
        },

        getChainConfigByChainOrNet: (state) => (chainOrNet, ecosystem) => {
            if (!state.chains[ecosystem]) return {};

            const chainList = values(state.chains[ecosystem]);

            const chain = chainList.find((chain) => chain.chain === chainOrNet || chain.net === chainOrNet);

            return chain || {};
        },

        getChainLogoByNet: (state) => (net) => {
            for (const ecosystem in state.chains)
                for (const chain in state.chains[ecosystem])
                    if (state.chains[ecosystem][chain].net === net) return state.chains[ecosystem][chain].logo;
        },

        getNativeTokenByChain: (state) => (chain, ecosystem) => {
            if (!state.chains[ecosystem][chain]) return {};

            if (!state.chains[ecosystem][chain].native_token) return {};

            return state.chains[ecosystem][chain].native_token || {};
        },

        getStakeTokens: (state) => Object.values(state.stakeTokens),
    },

    mutations: {
        [TYPES.SET_CHAIN_CONFIG](state, { chain, ecosystem, config }) {
            if (!state.chains[ecosystem][chain]) state.chains[ecosystem][chain] = {};
            if (config.net === 'berachain') config.isTestNet = true;
            state.chains[ecosystem][chain] = config;
        },

        [TYPES.SET_CONFIG_LOADING](state, value) {
            state.isConfigLoading = value || false;
        },

        [TYPES.SET_LAST_UPDATED](state, lastUpdated) {
            state.lastUpdated = lastUpdated;
        },
        [TYPES.SET_STAKE_TOKENS](state, tokens) {
            state.stakeTokens = tokens;
        },
    },

    actions: {
        async initConfigs({ dispatch }) {
            try {
                await Promise.all([
                    dispatch('initChainsByEcosystems', Ecosystem.COSMOS),
                    dispatch('initChainsByEcosystems', Ecosystem.EVM),
                ]);
            } catch (error) {
                console.error('Error while fetching configs', error);
            }
        },

        async initChainsByEcosystems({ commit, dispatch, state }, ecosystem) {
            try {
                const response = await getConfigsByEcosystems(ecosystem, { lastUpdated: state.lastUpdated });

                const dpChains = Object.values(DP_CHAINS);
                const chains = Object.keys(response);

                for (const chain of chains) {
                    if (state.chains[ecosystem][chain]) continue;
                    commit(TYPES.SET_CHAIN_CONFIG, { chain, ecosystem, config: response[chain] });
                }

                // Fetch tokens on secondary thread
                setTimeout(async () => {
                    await Promise.all(
                        chains.map((chain) =>
                            dpChains.includes(chain)
                                ? dispatch('initTokensByChain', { chain, ecosystem, lastUpdated: state.lastUpdated })
                                : null,
                        ),
                    );
                }, 1000);
            } catch (error) {
                console.error('Error while fetching chains', error);
            }
        },

        async initTokensByChain({}, { chain, ecosystem, lastUpdated }) {
            try {
                await getTokensConfigByChain(chain, ecosystem, { lastUpdated });
            } catch (error) {
                console.error('Error while fetching tokens config', error);
            }
        },

        async getTokensListForChain({}, chain) {
            try {
                return await ConfigsDB.getAllTokensByChain(chain);
            } catch (error) {
                return [];
            }
        },

        async getTokenConfigForChain({}, { chain, address }) {
            try {
                return await ConfigsDB.getTokenByChainAndAddress(chain, address);
            } catch (error) {
                return {};
            }
        },

        setConfigLoading({ commit }, value) {
            commit(TYPES.SET_CONFIG_LOADING, value);
        },

        async setLastUpdated({ commit }) {
            try {
                const lastUpdated = await getLastUpdated();

                commit(TYPES.SET_LAST_UPDATED, lastUpdated);
            } catch (error) {
                console.error('Error while fetching last updated date', error);
            }
        },

        async getTokenImage({}, tokenInfo) {
            try {
                const { chain, address } = tokenInfo;

                const [byChain, byAddress] = await Promise.all([
                    ConfigsDB.getTokenByChainAndAddress(chain, address),
                    ConfigsDB.getTokenByAddress(address),
                ]);

                if (!byChain && byAddress) {
                    const isAddressEqual = byAddress.address.toLowerCase() === address.toLowerCase();
                    const isSymbolEqual = byAddress.symbol.toLowerCase() === tokenInfo.symbol.toLowerCase();
                    return isAddressEqual && isSymbolEqual ? byAddress.logo : null;
                }

                if (byChain) return byChain.logo;

                return null;
            } catch (error) {
                return null;
            }
        },

        async setStakeTokens({ commit }) {
            try {
                const tokens = await getStakeTokens();

                commit(TYPES.SET_STAKE_TOKENS, tokens);
            } catch (error) {
                return {};
            }
        },
    },
};
