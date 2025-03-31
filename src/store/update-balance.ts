import { IUpdateBalanceByHash } from '@/shared/models/types/UpdateBalance';
import { values } from 'lodash';

const TYPES = {
    SET_UPDATE_BALANCE_FOR_ADDRESS: 'SET_UPDATE_BALANCE_FOR_ADDRESS',
    REMOVE_UPDATE_BALANCE_FOR_ADDRESS: 'REMOVE_UPDATE_BALANCE_FOR_ADDRESS',
    SET_IN_PROGRESS: 'SET_IN_PROGRESS',
    SET_QUEUES_TO_UPDATE: 'SET_QUEUES_TO_UPDATE',
};

interface IState {
    transactionHash: {
        [key: string]: Record<string, string>;
    };
    queueToUpdate: Record<
        string,
        {
            chain: string;
            address: string;
            hash: string;
            startTimestamp: number;
        }
    >;
}

export default {
    namespaced: true,

    state: (): IState => ({
        transactionHash: {},
        queueToUpdate: {},
    }),

    getters: {
        getQueueToUpdate: (state: IState) => values(state.queueToUpdate).filter((queue) => queue.startTimestamp === 0),
    },

    mutations: {
        [TYPES.SET_UPDATE_BALANCE_FOR_ADDRESS](state: IState, { hash, addresses }: IUpdateBalanceByHash) {
            !state.transactionHash[hash] && (state.transactionHash[hash] = {});
            state.transactionHash[hash] = addresses;

            for (const chain in addresses) {
                const address = addresses[chain];

                state.queueToUpdate[`${chain}_${address}_${hash}`] = {
                    chain,
                    address,
                    hash,
                    startTimestamp: 0,
                };
            }
        },
        [TYPES.REMOVE_UPDATE_BALANCE_FOR_ADDRESS](
            state: IState,
            { address, chain, hash }: { address: string; chain: string; hash: string },
        ) {
            if (state.transactionHash[hash]) delete state.transactionHash[hash][chain];

            const queueKey = `${chain}_${address}_${hash}`;

            delete state.queueToUpdate[queueKey];

            if (!Object.keys(state.transactionHash[hash]).length) delete state.transactionHash[hash];
        },
        [TYPES.SET_IN_PROGRESS](state: IState, queueKey: string) {
            if (!queueKey) return;
            state.queueToUpdate[queueKey]['startTimestamp'] = Date.now();
        },
    },

    actions: {
        setUpdateBalanceForAddress({ commit }, value: IUpdateBalanceByHash) {
            commit(TYPES.SET_UPDATE_BALANCE_FOR_ADDRESS, value);
        },
        removeUpdateBalanceForAddress({ commit }, value: { address: string; chain: string; hash: string }) {
            commit(TYPES.REMOVE_UPDATE_BALANCE_FOR_ADDRESS, value);
        },
        setInProgress({ commit }, value) {
            commit(TYPES.SET_IN_PROGRESS, value);
        },
    },
};
