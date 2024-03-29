import _ from 'lodash';

import { h } from 'vue';
import { LoadingOutlined, SettingOutlined } from '@ant-design/icons-vue';

import { IShortcutOp } from '../core/ShortcutOp';
import ShortcutRecipe from '../core/ShortcutRecipes';
import { IShortcutData } from '../core/Shortcut';

import { ShortcutStatus } from '../core/types/ShortcutType';
import OperationFactory from '@/modules/operations/OperationsFactory';
import { OperationStep } from '../core/models/Operation';
import { STATUSES, SHORTCUT_STATUSES } from '@/shared/models/enums/statuses.enum';

import StepOp from '@/components/shortcuts/StepItem/StepOp.vue';
import StepOpInfo from '@/components/shortcuts/StepItem/StepOpInfo.vue';

import ClearIcon from '@/assets/icons/form-icons/clear.svg';
import SuccessIcon from '@/assets/icons/form-icons/success.svg';
import WaitingIcon from '@/assets/icons/form-icons/waiting.svg';
import ProcessIcon from '@/assets/icons/form-icons/process.svg';

import { Spin } from 'ant-design-vue';

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

    SET_IS_SHORTCUT_LOADING: 'SET_IS_SHORTCUT_LOADING',
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
        [key: string]: IShortcutData;
    };

    shortcutOps: {
        [key: string]: OperationFactory;
    };

    isShortcutLoading: {
        [key: string]: boolean;
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
        isShortcutLoading: {},
    }),

    getters: {
        getIsShortcutLoading: (state: IState) => (shortcutId: string) => state.isShortcutLoading[shortcutId] || false,
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

            if (!shortcut[shortcutId].recipe || !shortcut[shortcutId].recipe.operations) {
                return null;
            }

            return shortcut[shortcutId].recipe.operations.find((op: IShortcutOp | ShortcutRecipe) => op.id === currentStepId);
        },

        getShortcutSteps: (state: IState, g, rs, rootGetters) => (shortcutId: string) => {
            const flow = state.shortcutOps[shortcutId].getFullOperationFlow();

            let hasError = false;

            const steps: OperationStep[] = flow.map((operation, index) => {
                const step = operation as OperationStep;

                const fromAssetChain = {
                    symbol: state.shortcutOps[shortcutId].getOperationById(step.operationId)?.getToken('from')?.chain,
                    logo: rootGetters['configs/getChainLogoByNet'](
                        state.shortcutOps[shortcutId].getOperationById(step.operationId)?.getToken('from')?.chain,
                    ),
                };

                const toAssetChain = {
                    symbol: state.shortcutOps[shortcutId].getOperationById(step.operationId)?.getToken('to')?.chain,
                    logo: rootGetters['configs/getChainLogoByNet'](
                        state.shortcutOps[shortcutId].getOperationById(step.operationId)?.getToken('to')?.chain,
                    ),
                };

                step.title = h(StepOpInfo, {
                    label: operation.title,
                    assetChain: {
                        from: fromAssetChain,
                        to: toAssetChain,
                    },
                    shortcutId,
                    operationId: step.operationId,
                });

                step.description = h(StepOp, {
                    operationType: step.make,
                    // assetChain: toAssetChain?.logo ? toAssetChain : fromAssetChain,
                    assetChain: fromAssetChain,
                });

                const status = state.shortcutOps[shortcutId].getOperationsStatusByKey(step.moduleIndex);

                if ([STATUSES.FAILED, STATUSES.SUCCESS].includes(status)) {
                    hasError = true;
                }

                if (status === STATUSES.FAILED) {
                    step.status = ShortcutStatus.error;
                    hasError = true;
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
                        spin: true,
                        class: 'loading-icon',
                    });
                }

                if (status === STATUSES.SUCCESS) {
                    step.icon = h(SuccessIcon);
                } else if (status === STATUSES.PENDING) {
                    step.icon = h(WaitingIcon);
                } else if (status === STATUSES.FAILED) {
                    step.icon = h(ClearIcon);
                } else if (status === STATUSES.ESTIMATING) {
                    step.icon = h(Spin, {
                        spin: true,
                        class: 'estimating-icon',
                    });
                }

                if (state.currentIndex === step.index && !hasError && status === STATUSES.PENDING) {
                    step.status = ShortcutStatus.process;
                    step.icon = h(ProcessIcon);
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
        [TYPES.SET_SHORTCUT](state: IState, { shortcut, data }: { shortcut: string; data: IShortcutData }) {
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
        [TYPES.SET_IS_SHORTCUT_LOADING](state: IState, { shortcutId, value }: { shortcutId: string; value: boolean }) {
            !state.isShortcutLoading[shortcutId] && (state.isShortcutLoading[shortcutId] = false);
            state.isShortcutLoading[shortcutId] = value;
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

        resetShortcut({ commit, state, getters }: any, { shortcutId }: { shortcutId: string }) {
            commit(TYPES.SET_CURRENT_INDEX, { index: 0 });
            commit(TYPES.SET_SHORTCUT_STATUS, { shortcutId, status: SHORTCUT_STATUSES.PENDING });

            if (state.shortcutOps[shortcutId]) {
                state.shortcutOps[shortcutId].resetOperationsStatus();
                const [firstStep] = getters.getShortcutSteps(shortcutId) || [];
                firstStep && commit(TYPES.SET_CURRENT_STEP_ID, { stepId: firstStep.id, shortcutId });
            }
        },

        resetAllShortcuts({ commit, state, getters }: any) {
            commit(TYPES.SET_CURRENT_INDEX, { index: 0 });

            for (const shortcut in state.shortcut) {
                commit(TYPES.SET_SHORTCUT_STATUS, { shortcutId: shortcut, status: SHORTCUT_STATUSES.PENDING });

                if (state.shortcutOps[shortcut]) {
                    state.shortcutOps[shortcut].resetOperationsStatus();
                    const [firstStep] = getters.getShortcutSteps(shortcut) || [];
                    firstStep && commit(TYPES.SET_CURRENT_STEP_ID, { stepId: firstStep.id, shortcut });
                }
            }
        },

        setIsShortcutLoading({ commit }: any, { shortcutId, value }: { shortcutId: string; value: boolean }) {
            commit(TYPES.SET_IS_SHORTCUT_LOADING, { shortcutId, value });
        },
    },
};
