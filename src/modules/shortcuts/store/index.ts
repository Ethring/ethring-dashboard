import _, { set } from 'lodash';

import logger from '@/shared/logger';
import { IRecipe } from '../core/models/Operation';
import { ShortcutType } from '../core/types/ShortcutType';

const TYPES = {
    SET_SHORTCUT: 'SET_SHORTCUT',
    SET_SHORTCUT_STATUS: 'SET_SHORTCUT_STATUS',
    SET_SHORTCUT_STEP_STATUS: 'SET_SHORTCUT_STEP_STATUS',
    SET_CURRENT_INDEX: 'SET_CURRENT_INDEX',
    SET_CURRENT_STEP_ID: 'SET_CURRENT_STEP_ID',
    SET_CURRENT_SHORTCUT_ID: 'SET_CURRENT_SHORTCUT_ID',
};

enum ShortcutStatus {
    wait = 'wait',
    finish = 'finish',
    process = 'process',
    error = 'error',
    skipped = 'skipped',
}

type ShortcutStatuses = keyof typeof ShortcutStatus;

interface IShortcutStatus {
    [key: string]: ShortcutStatus;
}

interface IState {
    currentShortcutId: string;
    currentStepId: string;
    currentIndex: number;

    shortcut: {
        [key: string]: IRecipe;
    };

    indexBySteps: {
        [key: string]: number;
    };

    shortcutStepStatus: {
        [key: string]: {
            [key: string]: ShortcutStatuses;
        };
    };
}

export default {
    namespaced: true,

    state: (): IState => ({
        currentShortcutId: '',
        currentStepId: '',
        currentIndex: 0,
        shortcut: {},
        shortcutStepStatus: {},
        indexBySteps: {},
    }),

    getters: {
        getCurrentShortcutId: (state: IState) => {
            return state.currentShortcutId;
        },

        getCurrentStepId: (state: IState) => state.currentStepId,

        getIndexByStepId: (state: IState) => (id: string) => {
            return state.indexBySteps[id];
        },
        getShortcutIndex: (state: IState) => state.currentIndex,

        getShortcut: (state: IState) => (shortcut: string) => {
            return state.shortcut[shortcut];
        },

        getShortcutSteps: (state: IState) => (shortcut: string) => {
            const { operations = [] } = state.shortcut[shortcut] || {};

            const flatList = _.flatMap(operations, (operation, index) => {
                const getStatus = (id: string) => {
                    const status = state.shortcutStepStatus[shortcut][id] ?? ShortcutStatus.wait;

                    if (status === ShortcutStatus.skipped) {
                        return ShortcutStatus.finish;
                    }

                    return status;
                };

                if (operation.type === ShortcutType.operation) {
                    state.indexBySteps[operation.id] = index;

                    return {
                        id: operation.id,
                        title: operation.name,
                        content: operation.layoutComponent,
                        status: getStatus(operation.id),
                    };
                } else if (operation.type === ShortcutType.recipe) {
                    return _.map(operation.operations, (subOperation, subIndex) => {
                        state.indexBySteps[subOperation.id] = subIndex;
                        return {
                            id: subOperation.id,
                            title: subOperation.name,
                            status: getStatus(subOperation.id),
                            content: operation.layoutComponent,
                        };
                    });
                }
            });

            return flatList;
        },

        getCurrentOperation: (state: IState) => (shortcutId: string) => {
            const { currentStepId, shortcut } = state;
            // find the step by id array in array of steps
            if (!shortcut[shortcutId]) {
                return null;
            }

            if (!currentStepId) {
                return null;
            }

            if (!shortcut[shortcutId].operations) {
                return null;
            }

            return (
                _.flatMap(shortcut[shortcutId].operations, (operation) => operation.operations || operation).find(
                    (operation) => operation.id === currentStepId,
                ) || null
            );
        },
    },

    mutations: {
        [TYPES.SET_SHORTCUT](state: IState, { shortcut, data }: { shortcut: string; data: IRecipe }) {
            state.shortcut[shortcut] = data;

            !state.shortcutStepStatus[shortcut] && (state.shortcutStepStatus[shortcut] = {});

            _.forEach(data.operations, (operation, index) => {
                if (index === 0 && operation.type === ShortcutType.operation) {
                    state.shortcutStepStatus[shortcut][operation.id] = ShortcutStatus.process;
                } else if (operation.type === ShortcutType.recipe) {
                    for (const subOperation of operation.operations) {
                        state.shortcutStepStatus[shortcut][subOperation.id] = ShortcutStatus.wait;
                    }
                } else {
                    state.shortcutStepStatus[shortcut][operation.id] = ShortcutStatus.wait;
                }
            });
        },
        [TYPES.SET_CURRENT_INDEX](state: IState, { index }: { index: number }) {
            state.currentIndex = index;
        },
        [TYPES.SET_CURRENT_STEP_ID](state: IState, { stepId, shortcutId }: { stepId: string; shortcutId: string }) {
            state.currentStepId = stepId;

            !state.shortcutStepStatus[shortcutId] && (state.shortcutStepStatus[shortcutId] = {});
            state.shortcutStepStatus[shortcutId][stepId] && (state.shortcutStepStatus[shortcutId][stepId] = ShortcutStatus.process);

            _.forEach(state.shortcutStepStatus[shortcutId], (status, id) => {
                if (id !== stepId && status === ShortcutStatus.process) {
                    state.shortcutStepStatus[shortcutId][id] = ShortcutStatus.wait;
                }
            });
        },
        [TYPES.SET_SHORTCUT_STEP_STATUS](
            state: IState,
            { shortcutId, stepId, status }: { shortcutId: string; stepId: string; status: ShortcutStatuses },
        ) {
            !state.shortcutStepStatus[shortcutId] && (state.shortcutStepStatus[shortcutId] = {});

            const isNotEqual = !_.isEqual(state.shortcutStepStatus[shortcutId][stepId], status);

            if (isNotEqual) {
                state.shortcutStepStatus[shortcutId][stepId] = status;
            }
        },
        [TYPES.SET_CURRENT_SHORTCUT_ID](state: IState, { shortcutId }: { shortcutId: string }) {
            state.currentShortcutId = shortcutId;
        },
    },
    actions: {
        setCurrentShortcutId({ commit }: any, { shortcutId }: { shortcutId: string }) {
            commit(TYPES.SET_CURRENT_SHORTCUT_ID, { shortcutId });
        },
        setShortcutIndex({ commit }: any, { index }: { index: number }) {
            commit(TYPES.SET_CURRENT_INDEX, { index });
        },
        setShortcut({ commit }: any, { shortcut, data }: { shortcut: string; data: any }) {
            commit(TYPES.SET_SHORTCUT, { shortcut, data });
        },

        setCurrentStepId({ commit }: any, { stepId, shortcutId }: { stepId: string; shortcutId: string }) {
            commit(TYPES.SET_CURRENT_STEP_ID, { stepId, shortcutId });
        },

        setShortcutStepStatus(
            { commit }: any,
            { shortcutId, stepId, status }: { shortcutId: string; stepId: string; status: ShortcutStatuses },
        ) {
            commit(TYPES.SET_SHORTCUT_STEP_STATUS, { shortcutId, stepId, status });
        },

        nextStep(context: any, { shortcutId }: { shortcutId: string }) {
            console.log('shortcutId', shortcutId, context);
            const { getters, commit } = context;
            console.log('context', context);
            const steps = getters.getShortcutSteps(shortcutId);
            console.log('steps', getters.getShortcutSteps(shortcutId), getters);
            const currentIndex = getters.getShortcutIndex;
            console.log('nextStep', currentIndex, steps.length);
            console.log('steps', steps);

            if (currentIndex < steps.length - 1) {
                console.log('calling next step', currentIndex + 1);
                commit(TYPES.SET_CURRENT_INDEX, { index: currentIndex + 1 });
                commit(TYPES.SET_CURRENT_STEP_ID, { stepId: steps[currentIndex + 1].id, shortcutId });
            }
        },
    },
};
