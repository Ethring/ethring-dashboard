import _ from 'lodash';

import { h } from 'vue';
import { LoadingOutlined } from '@ant-design/icons-vue';

import { IShortcutOp } from '../core/ShortcutOp';
import { IShortcutRecipe } from '../core/ShortcutRecipes';

import { ShortcutType } from '../core/types/ShortcutType';
import OperationFactory from '@/modules/operations/OperationsFactory';

const TYPES = {
    SET_SHORTCUT: 'SET_SHORTCUT',
    SET_SHORTCUT_STATUS: 'SET_SHORTCUT_STATUS',
    SET_SHORTCUT_STEP_STATUS: 'SET_SHORTCUT_STEP_STATUS',
    SET_CURRENT_INDEX: 'SET_CURRENT_INDEX',
    SET_CURRENT_STEP_ID: 'SET_CURRENT_STEP_ID',
    SET_CURRENT_SHORTCUT_ID: 'SET_CURRENT_SHORTCUT_ID',
    SET_SHORTCUT_OPS: 'SET_SHORTCUT_OPS',
};

enum ShortcutStatus {
    wait = 'wait',
    finish = 'finish',
    process = 'process',
    currentInProgress = 'currentInProgress',
    error = 'error',
    skipped = 'skipped',
}

const DISABLED_STATUS = [ShortcutStatus.finish, ShortcutStatus.skipped, ShortcutStatus.error];

type ShortcutStatuses = keyof typeof ShortcutStatus;

interface IShortcutStatus {
    [key: string]: ShortcutStatus;
}

interface OperationStep {
    id: string;
    title: string;
    content: string;
    status: ShortcutStatuses;
    isShowLayout: boolean;
    disabled?: boolean;
    icon?: any;
}

interface IState {
    currentShortcutId: string;
    currentStepId: string;
    currentIndex: number;

    shortcut: {
        [key: string]: IShortcutRecipe;
    };

    indexBySteps: {
        [key: string]: number;
    };

    shortcutStepStatus: {
        [key: string]: {
            [key: string]: ShortcutStatuses;
        };
    };

    shortcutOps: {
        [key: string]: OperationFactory;
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
        shortcutOps: {},
    }),

    getters: {
        getCurrentShortcutId: (state: IState) => {
            return state.currentShortcutId;
        },

        getShortcutOpsFactory: (state: IState) => (shortcutId: string) => {
            return state.shortcutOps[shortcutId] || null;
        },

        getCurrentStepId: (state: IState) => state.currentStepId,

        getIndexByStepId: (state: IState) => (id: string) => {
            return state.indexBySteps[id];
        },
        getShortcutIndex: (state: IState) => state.currentIndex,

        getShortcut: (state: IState) => (shortcut: string) => {
            return state.shortcut[shortcut];
        },

        getShortcutSteps: (state: IState, g, rs, rootGetters) => (shortcut: string) => {
            let hasError = false;

            const { operations = [] } = state.shortcut[shortcut] || {};

            const getStatus = (id: string): ShortcutStatuses => {
                const status: ShortcutStatuses = state.shortcutStepStatus[shortcut][id] ?? ShortcutStatus.wait;
                return status === ShortcutStatus.skipped ? ShortcutStatus.finish : status;
            };

            const processOperation = (
                op: IShortcutRecipe,
                index: number,
                { content, isShowLayout }: { content?: string; isShowLayout?: boolean } = {},
            ): OperationStep => {
                state.indexBySteps[op.id] = index;

                const status = getStatus(op.id) as ShortcutStatus;

                if (status === ShortcutStatus.error) {
                    hasError = true;
                }

                const opData: OperationStep = {
                    id: op.id,
                    title: op.name,
                    content: content || op.layoutComponent,
                    isShowLayout: op.isShowLayout || isShowLayout || false,
                    status,
                };

                if (hasError || DISABLED_STATUS.includes(status) || rootGetters['txManager/isTransactionSigning']) {
                    opData.disabled = true;
                }

                opData.disabled = state.currentIndex !== index;

                if (status === ShortcutStatus.currentInProgress) {
                    opData.icon = h(LoadingOutlined, {
                        style: {
                            fontSize: '24px',
                        },
                        spin: true,
                    });
                }

                return opData;
            };

            const flatList: OperationStep[] = operations.flatMap((operation, index) => {
                switch (operation.type) {
                    case ShortcutType.operation:
                        return processOperation(operation, index);
                    case ShortcutType.recipe:
                        return operation.operations.map((subOperation) =>
                            processOperation(subOperation, index, {
                                content: operation.layoutComponent,
                                isShowLayout: operation.isShowLayout,
                            }),
                        );
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
        [TYPES.SET_SHORTCUT](state: IState, { shortcut, data }: { shortcut: string; data: IShortcutRecipe }) {
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

        [TYPES.SET_SHORTCUT_OPS](state: IState, { shortcutId, operations }: { shortcutId: string; operations: OperationFactory }) {
            state.shortcutOps[shortcutId] = operations;
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
            const { getters, commit } = context;
            const steps = getters.getShortcutSteps(shortcutId);
            const currentIndex = getters.getShortcutIndex;

            if (currentIndex < steps.length - 1) {
                console.log('calling next step', currentIndex + 1);
                commit(TYPES.SET_CURRENT_INDEX, { index: currentIndex + 1 });
                commit(TYPES.SET_CURRENT_STEP_ID, { stepId: steps[currentIndex + 1].id, shortcutId });
            }
        },

        setShortcutOpsFactory({ commit }: any, { shortcutId, operations }: { shortcutId: string; operations: OperationFactory }) {
            commit(TYPES.SET_SHORTCUT_OPS, { shortcutId, operations });
        },
    },
};
