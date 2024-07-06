import { isEmpty } from 'lodash';

import { IShortcutOp } from '../core/ShortcutOp';
import { IShortcutData } from '../core/Shortcut';

import OperationFactory from '@/core/operations/OperationsFactory';
import { STATUSES, SHORTCUT_STATUSES } from '@/shared/models/enums/statuses.enum';
import { TRANSACTION_TYPES } from '@/core/operations/models/enums/tx-types.enum';
import OperationsFactory from '@/core/operations/OperationsFactory';
import { OperationStep } from '../core/models/Operation';
import { TxOperationFlow } from '@/shared/models/types/Operations';

import StepOpInfo from '@/components/shortcuts/StepItem/StepOpInfo.vue';
import StepOp from '@/components/shortcuts/StepItem/StepOp.vue';
import { ShortcutStatus, StepStatusIcons } from '../core/types/ShortcutType';
import { StepProps } from 'ant-design-vue';
import { h } from 'vue';
import { IBaseOperation } from '@/core/operations/models/Operations';
import DebridgeApi from '@/modules/debridge/api';

const TYPES = {
    SET_SHORTCUT: 'SET_SHORTCUT',
    SET_SHORTCUT_STATUS: 'SET_SHORTCUT_STATUS',
    SET_CURRENT_INDEX: 'SET_CURRENT_INDEX',
    SET_CURRENT_STEP_ID: 'SET_CURRENT_STEP_ID',
    SET_CURRENT_SHORTCUT_ID: 'SET_CURRENT_SHORTCUT_ID',
    SET_SHORTCUT_OPS: 'SET_SHORTCUT_OPS',
    SET_CURRENT_LAYOUT: 'SET_CURRENT_LAYOUT',
    SET_OPERATION_STEPS: 'SET_OPERATION_STEPS',

    SET_IS_SHORTCUT_LOADING: 'SET_IS_SHORTCUT_LOADING',
    SET_IS_REQUESTING_NFT: 'SET_IS_REQUESTING_NFT',
    SET_IS_CALL_ESTIMATE: 'SET_IS_CALL_ESTIMATE',

    SET_DEBRIDGE_INFO: 'SET_DEBRIDGE_INFO',
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

    isRequestingNfts: {
        [key: string]: boolean;
    };
    isCallEstimate: {
        [key: string]: boolean;
    };
    deBridgeInfo: {
        [key: string]: string;
    };
}

export default {
    namespaced: true,

    // ================================================================================
    // * ========================== STATE ========================================== *
    // ================================================================================

    state: (): IState => ({
        currentLayout: '',
        currentShortcutId: '',
        currentStepId: '',
        currentIndex: 0,
        shortcut: {},

        shortcutOps: {},
        shortcutStatus: {},
        isShortcutLoading: {},

        isRequestingNfts: {},
        isCallEstimate: {},

        deBridgeInfo: {},
    }),

    // ================================================================================
    // * ========================== GETTERS ======================================== *
    // ================================================================================

    getters: {
        getIsRequestingNfts: (state: IState) => (shortcutId: string) => state.isRequestingNfts[shortcutId] || false,
        getIsShortcutLoading: (state: IState) => (shortcutId: string) => state.isShortcutLoading[shortcutId] || false,
        getIsCallEstimate: (state: IState) => (shortcutId: string) => state.isCallEstimate[shortcutId] || false,

        getCurrentShortcutId: (state: IState) => state.currentShortcutId,
        getCurrentLayout: (state: IState) => state.currentLayout,
        getShortcutStatus: (state: IState) => (shortcutId: string) => state.shortcutStatus[shortcutId] || null,

        getShortcutOpsFactory: (state: IState) => (shortcutId: string) => state.shortcutOps[shortcutId] || null,

        getCurrentStepId: (state: IState) => state.currentStepId,

        getShortcutIndex: (state: IState) => state.currentIndex,

        getShortcut: (state: IState) => (shortcut: string) => {
            return state.shortcut[shortcut];
        },

        getDeBridgeInfo: (state: IState) => (address: string) => state.deBridgeInfo[address],

        getShortcutOpInfoById: (state: IState) => (shortcutId: string, operationId: string) => {
            // ! if shortcut id is not provided, return null
            if (!shortcutId) return null;

            // ! if shortcut is empty, return null
            if (JSON.stringify(state.shortcut) === '{}') return null;

            if (!state.shortcut[shortcutId]) return null;

            if (!state.shortcut[shortcutId].operations) return null;

            // ! if operations exist but empty, return null
            if (state.shortcut[shortcutId].operations && !state.shortcut[shortcutId].operations.length) return null;

            const operation = state.shortcut[shortcutId].operations.find((op) => op.id === operationId) as IShortcutOp;

            if (!operation) return null;

            return operation;
        },
        getCurrentOperation: (state: IState) => (shortcutId: string) => {
            // ! if shortcut id is not provided, return null
            if (!shortcutId) return null;

            // ! if shortcut is empty, return null
            if (JSON.stringify(state.shortcut) === '{}') return null;

            // ! if shortcut id is not found in the state, return null
            if (!state.shortcut[shortcutId]) return null;

            // ! if current step id is not found, return null
            if (!state.currentStepId) return null;

            if (!state.shortcut[shortcutId].operations) return null;

            // ! if operations exist but empty, return null
            if (state.shortcut[shortcutId].operations && !state.shortcut[shortcutId].operations.length) return null;

            const operation = state.shortcut[shortcutId].operations.find((op) => op.id === state.currentStepId) as IShortcutOp;

            // ! if operation is not found, return null
            if (!operation) return null;

            return operation;
        },

        getShortcutOpsFlow:
            (state: IState) =>
            (shortcutId: string): TxOperationFlow[] => {
                return state.shortcutOps[shortcutId].getFullOperationFlow();
            },

        getShortcutSteps:
            (state: IState, _g: any, _rs: any, rootGetters: any) =>
            (shortcutId: string): StepProps[] => {
                if (!shortcutId || !state.shortcutOps[shortcutId]) return [];
                if (!state.shortcutOps[shortcutId].getFullOperationFlow) return [];
                if (typeof state.shortcutOps[shortcutId].getFullOperationFlow !== 'function') return [];

                const operationFactory = state.shortcutOps[shortcutId] as OperationsFactory;

                let hasError = false;

                const setStatus = (step: OperationStep) => {
                    // Status by operation status
                    step.status = isEmpty(step.status) ? ShortcutStatus.wait : step.status;

                    const isCurrentStep = state.currentStepId === step.id;

                    // Check if operation has error
                    hasError = [STATUSES.FAILED, STATUSES.REJECTED].includes(
                        state.shortcutOps[shortcutId].getOperationsStatusByKey(step.moduleIndex),
                    );

                    if (isCurrentStep) {
                        step.icon = StepStatusIcons[STATUSES.SIGNING];
                        step.status = ShortcutStatus.process;
                    }

                    // Set Estimating icon
                    if (isCurrentStep && STATUSES.ESTIMATING === state.shortcutOps[shortcutId].getOperationsStatusByKey(step.moduleIndex))
                        step.icon = StepStatusIcons[STATUSES.ESTIMATING];
                    // Set In Progress icon
                    else if (
                        isCurrentStep &&
                        state.shortcutOps[shortcutId].getOperationsStatusByKey(step.moduleIndex) === STATUSES.IN_PROGRESS
                    )
                        step.icon = StepStatusIcons[STATUSES.IN_PROGRESS];
                    // Set Failed icon
                    else if (hasError && isCurrentStep) step.icon = StepStatusIcons[STATUSES.FAILED];
                };

                // Get the full operation flow from the factory and filter out the approve operation
                return operationFactory
                    .getFullOperationFlow()
                    .filter((op) => op.type !== TRANSACTION_TYPES.APPROVE)
                    .map((operation, index) => {
                        const step = operation as OperationStep;

                        step.index = index;

                        if (!step.id && step.operationId) step.id = step.operationId;

                        step.icon = StepStatusIcons[state.shortcutOps[shortcutId].getOperationsStatusByKey(step.moduleIndex)] as any;

                        setStatus(step);

                        // ================================================================================
                        // * Operation chain info
                        // ================================================================================
                        const operationInstance = state.shortcutOps[shortcutId].getOperationById(step.operationId) as IBaseOperation;

                        const assetChain = {
                            symbol: operationInstance.tokens.from?.symbol,
                            logo: rootGetters['configs/getChainLogoByNet'](operationInstance.tokens.from?.chain),
                        };

                        return {
                            // ================================================================================
                            // * Shortcut operation info component, title & token from/to chain info
                            // ================================================================================\

                            title: h(StepOpInfo, {
                                label: operation.title as string,
                                shortcutId,
                                operationId: step.operationId,
                            }),

                            // ================================================================================
                            // * Shortcut operation icon component & from chain info
                            // ================================================================================
                            description: h(StepOp, {
                                operationType: step.make,
                                assetChain,
                            }),

                            icon: step.icon,
                            status: step.status,

                            // Disable step if it's not current step
                            disabled: DISABLED_STATUS.includes(step.status as ShortcutStatus) || step.index !== state.currentIndex,
                        } as StepProps;
                    });
            },
    },

    // ================================================================================
    // * ========================== MUTATIONS ======================================= *
    // ================================================================================

    mutations: {
        [TYPES.SET_SHORTCUT](state: IState, { shortcut, data }: { shortcut: string; data: IShortcutData }) {
            state.shortcut[shortcut] = data;
        },
        [TYPES.SET_CURRENT_INDEX](state: IState, { index }: { index: number }) {
            state.currentIndex = index;
        },
        [TYPES.SET_CURRENT_STEP_ID](state: IState, { stepId }: { stepId: string; shortcutId: string }) {
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
            if (state.shortcutStatus[shortcutId] === status) return;
            state.shortcutStatus[shortcutId] = status;
        },
        [TYPES.SET_IS_SHORTCUT_LOADING](state: IState, { shortcutId, value }: { shortcutId: string; value: boolean }) {
            !state.isShortcutLoading[shortcutId] && (state.isShortcutLoading[shortcutId] = false);
            state.isShortcutLoading[shortcutId] = value;
        },
        [TYPES.SET_IS_REQUESTING_NFT](state: IState, { shortcutId, value }: { shortcutId: string; value: boolean }) {
            !state.isRequestingNfts[shortcutId] && (state.isRequestingNfts[shortcutId] = false);
            state.isRequestingNfts[shortcutId] = value;
        },
        [TYPES.SET_IS_CALL_ESTIMATE](state: IState, { shortcutId, value }: { shortcutId: string; value: boolean }) {
            !state.isCallEstimate[shortcutId] && (state.isCallEstimate[shortcutId] = false);
            state.isCallEstimate[shortcutId] = value;
        },
        [TYPES.SET_DEBRIDGE_INFO](state: IState, value: any) {
            state.deBridgeInfo = value;
        },
    },

    // ================================================================================
    // * ========================== ACTIONS ========================================= *
    // ================================================================================

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
            const currentIndex = getters.getShortcutIndex;

            const factory = getters.getShortcutOpsFactory(shortcutId) as OperationFactory;

            const WithApprove = factory.getFullOperationFlow();

            const steps = WithApprove.filter((op) => op.type !== TRANSACTION_TYPES.APPROVE).map((op) => {
                const step = op as OperationStep;
                if (!step.id && step.operationId) step.id = step.operationId;

                return step;
            }) as OperationStep[];

            console.log('nextStep -> currentIndex', currentIndex, steps.length, steps);

            if (currentIndex < steps.length - 1) {
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

        resetShortcut({ commit, state }: any, { shortcutId, stepId }: { shortcutId: string; stepId?: string }) {
            if (state.shortcutOps[shortcutId]) state.shortcutOps[shortcutId].resetOperationsStatus();

            commit(TYPES.SET_CURRENT_INDEX, { index: 0 });

            commit(TYPES.SET_SHORTCUT_STATUS, { shortcutId, status: SHORTCUT_STATUSES.PENDING });

            stepId && commit(TYPES.SET_CURRENT_STEP_ID, { stepId, shortcutId });
        },

        resetAllShortcuts({ commit, state }: any) {
            commit(TYPES.SET_CURRENT_INDEX, { index: 0 });

            for (const shortcut in state.shortcut) {
                commit(TYPES.SET_SHORTCUT_STATUS, { shortcutId: shortcut, status: SHORTCUT_STATUSES.PENDING });
                commit(TYPES.SET_CURRENT_STEP_ID, { stepId: null, shortcutId: shortcut });
                commit(TYPES.SET_CURRENT_SHORTCUT_ID, { shortcutId: null });

                state.shortcutOps[shortcut] = null;
            }
        },

        setIsShortcutLoading({ commit }: any, { shortcutId, value }: { shortcutId: string; value: boolean }) {
            commit(TYPES.SET_IS_SHORTCUT_LOADING, { shortcutId, value });
        },
        setIsRequestingNfts({ commit }: any, { shortcutId, value }: { shortcutId: string; value: boolean }) {
            commit(TYPES.SET_IS_REQUESTING_NFT, { shortcutId, value });
        },
        setIsCallEstimate({ commit }: any, { shortcutId, value }: { shortcutId: string; value: boolean }) {
            commit(TYPES.SET_IS_CALL_ESTIMATE, { shortcutId, value });
        },
        async loadDebridgeInfo({ state, commit }: any, address: string) {
            if (state.deBridgeInfo[address]) return state.deBridgeInfo[address];

            const service = new DebridgeApi();

            const pointsInfo = await service.getDebridgePoints(address);
            const multiplierInfo = await service.getMultiplierInfo(address);

            const data = {
                ...state.deBridgeInfo,
                [address]: {
                    points: pointsInfo?.totalPoints || 0,
                    multiplier: multiplierInfo?.finalMultiplier || 1,
                },
            };

            commit(TYPES.SET_DEBRIDGE_INFO, data);
        },
    },
};
