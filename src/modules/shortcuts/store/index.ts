import _ from 'lodash';

import { h } from 'vue';
import { LoadingOutlined } from '@ant-design/icons-vue';

import { IShortcutOp } from '../core/ShortcutOp';
import { IShortcutRecipe } from '../core/ShortcutRecipes';

import { ShortcutStatus, ShortcutType, ShortcutStatuses } from '../core/types/ShortcutType';
import OperationFactory from '@/modules/operations/OperationsFactory';
import { OperationStep } from '../core/models/Operation';
import { STATUSES, SHORTCUT_STATUSES } from '@/shared/models/enums/statuses.enum';

const TYPES = {
    SET_SHORTCUT: 'SET_SHORTCUT',
    SET_SHORTCUT_STATUS: 'SET_SHORTCUT_STATUS',
    SET_SHORTCUT_STEP_STATUS: 'SET_SHORTCUT_STEP_STATUS',
    SET_CURRENT_INDEX: 'SET_CURRENT_INDEX',
    SET_CURRENT_STEP_ID: 'SET_CURRENT_STEP_ID',
    SET_CURRENT_SHORTCUT_ID: 'SET_CURRENT_SHORTCUT_ID',
    SET_SHORTCUT_OPS: 'SET_SHORTCUT_OPS',
    SET_CURRENT_LAYOUT: 'SET_CURRENT_LAYOUT',
    SET_OPERATION_STEPS: 'SET_OPERATION_STEPS',
};

const DISABLED_STATUS = [ShortcutStatus.finish, ShortcutStatus.error];

interface IState {
    currentShortcutId: string;
    currentStepId: string;
    currentIndex: number;
    currentLayout: string;

    shortcutStatus: {
        [key: string]: SHORTCUT_STATUSES;
    };

    shortcut: {
        [key: string]: IShortcutRecipe;
    };

    shortcutOps: {
        [key: string]: OperationFactory;
    };
}

export default {
    namespaced: true,

    state: (): IState => ({
        currentLayout: 'SuperSwap',
        currentShortcutId: '',
        currentStepId: '',
        currentIndex: 0,
        shortcut: {},

        shortcutOps: {},
        shortcutStatus: {},
    }),

    getters: {
        getCurrentShortcutId: (state: IState) => state.currentShortcutId,
        getCurrentLayout: (state: IState) => state.currentLayout,
        getShortcutStatus: (state: IState) => (shortcutId: string) => state.shortcutStatus[shortcutId] || null,

        getShortcutOpsFactory: (state: IState) => (shortcutId: string) => state.shortcutOps[shortcutId] || null,

        getCurrentStepId: (state: IState) => state.currentStepId,

        getShortcutIndex: (state: IState) => state.currentIndex,

        getShortcut: (state: IState) => (shortcut: string) => {
            return state.shortcut[shortcut];
        },

        getCurrentOperation: (state: IState) => (shortcutId: string) => {
            const { currentStepId, shortcut } = state;

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

        getShortcutSteps: (state: IState) => (shortcutId: string) => {
            const opFactory = state.shortcutOps[shortcutId];

            const flow = opFactory.getFullOperationFlow();

            let hasError = false;

            const steps: OperationStep[] = flow.map((operation, index) => {
                const step = operation as OperationStep;

                if (opFactory.getOperationById(step.operationId)) {
                    const op = opFactory.getOperationById(step.operationId);

                    if (op?.getTitle) {
                        step.description = _.isEqual(op.getTitle(), step.title) ? null : op.getTitle();
                    } else {
                        step.description = null;
                    }
                }

                const status = opFactory.getOperationsStatusByKey(step.moduleIndex);

                if ([STATUSES.FAILED, STATUSES.SUCCESS].includes(status)) {
                    hasError = true;
                }

                if (status === STATUSES.FAILED) {
                    step.status = ShortcutStatus.error;
                    hasError = true;
                }

                if (state.currentIndex === step.index && !hasError) {
                    step.status = ShortcutStatus.process;
                }

                if (status === STATUSES.SUCCESS) {
                    step.status = ShortcutStatus.finish;
                }

                if (!step.id && step.operationId) {
                    step.id = step.operationId;
                }

                step.disabled = DISABLED_STATUS.includes(step.status as ShortcutStatus) || step.index !== state.currentIndex;

                step.icon = null;

                if (status === STATUSES.IN_PROGRESS) {
                    step.icon = h(LoadingOutlined, {
                        style: {
                            fontSize: '24px',
                        },
                        spin: true,
                    });
                }

                return step;
            });

            if (!steps.length) {
                return [];
            }

            return steps;
        },
    },

    mutations: {
        [TYPES.SET_SHORTCUT](state: IState, { shortcut, data }: { shortcut: string; data: IShortcutRecipe }) {
            state.shortcut[shortcut] = data;
        },
        [TYPES.SET_CURRENT_INDEX](state: IState, { index }: { index: number }) {
            state.currentIndex = index;
        },
        [TYPES.SET_CURRENT_STEP_ID](state: IState, { stepId, shortcutId }: { stepId: string; shortcutId: string }) {
            state.currentStepId = stepId;
        },
        [TYPES.SET_CURRENT_SHORTCUT_ID](state: IState, { shortcutId }: { shortcutId: string }) {
            state.currentShortcutId = shortcutId;
        },
        [TYPES.SET_SHORTCUT_OPS](state: IState, { shortcutId, operations }: { shortcutId: string; operations: OperationFactory }) {
            state.shortcutOps[shortcutId] = operations;
        },

        [TYPES.SET_CURRENT_LAYOUT](state: IState, { layout }: { layout: string }) {
            state.currentLayout = layout;
        },

        [TYPES.SET_SHORTCUT_STATUS](state: IState, { shortcutId, status }: { shortcutId: string; status: SHORTCUT_STATUSES }) {
            state.shortcutStatus[shortcutId] = status;
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

        setCurrentLayout({ commit }: any, { layout }: { layout: string }) {
            commit(TYPES.SET_CURRENT_LAYOUT, { layout });
        },

        setShortcutStatus({ commit }: any, { shortcutId, status }: { shortcutId: string; status: SHORTCUT_STATUSES }) {
            commit(TYPES.SET_SHORTCUT_STATUS, { shortcutId, status });
        },
    },
};
