import _ from 'lodash';

const TYPES = {
    SET_UPDATE_BALANCE_FOR_ADDRESS: 'SET_UPDATE_BALANCE_FOR_ADDRESS',
    REMOVE_UPDATE_BALANCE_FOR_ADDRESS: 'REMOVE_UPDATE_BALANCE_FOR_ADDRESS',
    SET_IN_PROGRESS: 'SET_IN_PROGRESS',
    SET_QUEUES_TO_UPDATE: 'SET_QUEUES_TO_UPDATE',
};

export default {
    namespaced: true,

    state: () => ({
        inProgress: {},
        transactionHash: {},
        updateBalanceForAddress: {},
        queueToUpdate: {},
    }),

    getters: {
        getInProgress: (state) => (address: string) => {
            if (state.inProgress[address]) return state.inProgress[address];
            return state.inProgress[address];
        },
        getQueueToUpdate: (state) => _.values(state.queueToUpdate),
        updateBalanceForAddress: (state) => {
            const response = {};

            for (const address in state.updateBalanceForAddress) {
                response[address] = _.keys(state.updateBalanceForAddress[address]);
            }

            return response;
        },

        isWaitingTxStatusForModule: (state) => (module) => state.isWaitingTxStatus[module] || null,
    },

    mutations: {
        [TYPES.SET_UPDATE_BALANCE_FOR_ADDRESS](state, { hash, address, chains }) {
            !state.transactionHash[hash] && (state.transactionHash[hash] = {});

            for (const chain of chains) {
                const uniqueKey = `${chain}_${address}`;

                if (state.transactionHash[hash] && state.transactionHash[hash][uniqueKey]) {
                    return;
                }

                state.transactionHash[hash][uniqueKey] = true;

                !state.updateBalanceForAddress[address] && (state.updateBalanceForAddress[address] = {});
                !state.updateBalanceForAddress[address][chain] && (state.updateBalanceForAddress[address][chain] = true);
            }
        },
        [TYPES.REMOVE_UPDATE_BALANCE_FOR_ADDRESS](state, { address, chain }) {
            if (!state.updateBalanceForAddress[address]) {
                return;
            }

            const uniqueKey = `${chain}_${address}`;

            delete state.updateBalanceForAddress[address][chain];
            delete state.updateBalanceForAddress[address];
            delete state.queueToUpdate[uniqueKey];
            delete state.inProgress[uniqueKey];

            for (const key in state.transactionHash) {
                if (state.transactionHash[key][uniqueKey]) {
                    delete state.transactionHash[key][uniqueKey];
                }

                if (!Object.keys(state.transactionHash[key]).length) {
                    delete state.transactionHash[key];
                }
            }
        },
        [TYPES.SET_IN_PROGRESS](state, { address, status }: { address: string; status: boolean }) {
            if (!state.inProgress[address]) return (state.inProgress[address] = status);
            state.inProgress[address] = status;
        },
        [TYPES.SET_QUEUES_TO_UPDATE](
            state,
            {
                chain,
                address,
                mainAddress,
                config,
            }: {
                chain: string;
                address: string;
                mainAddress: string;
                config: any;
            },
        ) {
            const uniqueKey = `${chain}_${mainAddress}`;

            state.queueToUpdate[uniqueKey] = {
                chain,
                address,
                mainAddress,
                config,
            };
        },
    },

    actions: {
        setUpdateBalanceForAddress({ commit }, value) {
            commit(TYPES.SET_UPDATE_BALANCE_FOR_ADDRESS, value);
        },
        removeUpdateBalanceForAddress({ commit }, value) {
            commit(TYPES.REMOVE_UPDATE_BALANCE_FOR_ADDRESS, value);
        },
        setInProgress({ commit }, { address, status }) {
            commit(TYPES.SET_IN_PROGRESS, { address, status });
        },
        setQueuesToUpdate({ commit }, value) {
            commit(TYPES.SET_QUEUES_TO_UPDATE, value);
        },
    },
};
