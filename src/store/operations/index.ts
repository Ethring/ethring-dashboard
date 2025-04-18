import { DIRECTIONS, DIRECTIONS_TYPE, ModuleType, TOKEN_SELECT_TYPES, TOKEN_SELECT_TYPES_TYPE } from '@/shared/models/enums/modules.enum';
import { IAsset, IFields, INetwork } from '@/shared/models/fields/module-fields';

import { Field } from '@/shared/models/enums/fields.enum';
import { useLocalStorage } from '@vueuse/core';

const CUSTOM_SLIPPAGE_KEY = 'slippage';
const slippageFromStore = useLocalStorage(CUSTOM_SLIPPAGE_KEY, 0.5, { mergeDefaults: true });

const TYPES = {
    SET_SRC_NETWORK: 'SET_FROM_NETWORK',
    SET_DST_NETWORK: 'SET_DST_NETWORK',

    SET_SRC_TOKEN: 'SET_FROM_TOKEN',
    SET_DST_TOKEN: 'SET_DST_TOKEN',

    SET_SRC_AMOUNT: 'SET_SRC_AMOUNT',

    SET_DST_AMOUNT: 'SET_DST_AMOUNT',

    SET_SLIPPAGE: 'SET_SLIPPAGE',

    SET_RECEIVER_ADDRESS: 'SET_RECEIVER_ADDRESS',

    SET_ONLY_BALANCE: 'SET_ONLY_BALANCE',

    SET_DIRECTION: 'SET_DIRECTION',

    SET_TOKEN_SELECT_TYPE: 'SET_TOKEN_SELECT_TYPE',

    SET_APPROVE_FOR_ACCOUNT_ADDRESS: 'SET_APPROVE_FOR_ACCOUNT_ADDRESS',

    SET_CLEAR_APPROVE_FOR_TOKEN: 'SET_CLEAR_APPROVE_FOR_TOKEN',

    SET_SELECTED_SERVICE: 'SET_SELECTED_SERVICE',

    SET_OPERATION_RESULT: 'SET_OPERATION_RESULT',

    SET_MEMO: 'SET_MEMO',

    RESET_SRC_BALANCE_FOR_ACCOUNT: 'RESET_SRC_BALANCE_FOR_ACCOUNT',

    RESET_ALL_FIELDS: 'RESET_ALL_FIELDS',

    SWAP_DIRECTION: 'SWAP_DIRECTION',

    SET_CURRENT_MODULE: 'SET_CURRENT_MODULE',

    SET_VALUE_BY_MODULE: 'SET_VALUE_BY_MODULE',

    SET_CALL_CONFIRM: 'SET_CALL_CONFIRM',

    SET_SERVICE_ID: 'SET_SERVICE_ID',

    SET_CONTRACT_ADDRESS: 'SET_CONTRACT_ADDRESS',

    SET_CONTRACT_CALL_COUNT: 'SET_CONTRACT_CALL_COUNT',

    SET_FUNDS: 'SET_FUNDS',

    SET_IS_INPUT: 'SET_IS_INPUT',

    SET_SELECTED_POOL: 'SET_SELECTED_POOL',
};

const fieldSetter = {
    srcNetwork: TYPES.SET_SRC_NETWORK,
    srcToken: TYPES.SET_SRC_TOKEN,
    dstNetwork: TYPES.SET_DST_NETWORK,
    dstToken: TYPES.SET_DST_TOKEN,
    srcAmount: TYPES.SET_SRC_AMOUNT,
    dstAmount: TYPES.SET_DST_AMOUNT,
    receiverAddress: TYPES.SET_RECEIVER_ADDRESS,
    onlyWithBalance: TYPES.SET_ONLY_BALANCE,
    swapDirection: TYPES.SET_DIRECTION,
    direction: TYPES.SET_DIRECTION,
    selectType: TYPES.SET_TOKEN_SELECT_TYPE,
    memo: TYPES.SET_MEMO,
    serviceId: TYPES.SET_SERVICE_ID,
    contractAddress: TYPES.SET_CONTRACT_ADDRESS,
    contractCallCount: TYPES.SET_CONTRACT_CALL_COUNT,
    funds: TYPES.SET_FUNDS,
    slippage: TYPES.SET_SLIPPAGE,
    selectedPool: TYPES.SET_SELECTED_POOL,
};

interface IState extends IFields {
    module: ModuleType;

    direction: keyof typeof DIRECTIONS;
    selectType: keyof typeof TOKEN_SELECT_TYPES;

    operationResult: {
        [key in ModuleType]?: any;
    };

    onlyWithBalance: boolean;

    serviceId: {
        [key in ModuleType]?: string;
    };

    isForceCallConfirm: {
        [key in ModuleType]?: boolean;
    };

    isInput: boolean;

    selectedPool: any;
}

export default {
    namespaced: true,
    state: (): IState => ({
        module: null,

        serviceId: {
            [ModuleType.send]: null,
            [ModuleType.stake]: null,
            [ModuleType.swap]: null,
            [ModuleType.bridge]: null,
            [ModuleType.superSwap]: null,
            [ModuleType.shortcut]: null,
            [ModuleType.nft]: null,
        },

        direction: DIRECTIONS.SOURCE,
        selectType: TOKEN_SELECT_TYPES.FROM,

        onlyWithBalance: false,

        operationResult: {},

        [Field.srcNetwork]: null,
        [Field.srcToken]: null,
        [Field.dstNetwork]: null,
        [Field.dstToken]: null,
        [Field.srcAmount]: '',
        [Field.dstAmount]: '',
        [Field.switchDirection]: false,
        [Field.receiverAddress]: '',
        [Field.memo]: '',
        [Field.isSendToAnotherAddress]: false,

        [Field.contractAddress]: '',
        [Field.contractCallCount]: 0,

        [Field.funds]: null,
        slippage: slippageFromStore.value || 0.5,

        isInput: false,

        isForceCallConfirm: {
            [ModuleType.send]: false,
            [ModuleType.stake]: false,
            [ModuleType.swap]: false,
            [ModuleType.bridge]: false,
            [ModuleType.superSwap]: false,
            [ModuleType.shortcut]: false,
            [ModuleType.nft]: false,
        },

        selectedPool: null,
    }),

    getters: {
        isForceCallConfirm:
            (state: IState) =>
            (module: ModuleType): boolean =>
                state.isForceCallConfirm[module] || false,

        direction: (state: IState): DIRECTIONS_TYPE => state.direction,
        selectType: (state: IState): TOKEN_SELECT_TYPES_TYPE => state.selectType,

        onlyWithBalance: (state: IState): boolean => state.onlyWithBalance,

        getServiceId:
            (state: IState) =>
            (module: ModuleType): string =>
                state.serviceId[module] || null,

        // ****************************************************
        // * =================== NETWORKS =================== *
        // ****************************************************

        srcNetwork: (state: IState): INetwork => state[Field.srcNetwork],
        dstNetwork: (state: IState): INetwork => state[Field.dstNetwork],

        // ****************************************************
        // * =================== TOKENS =================== *
        // ****************************************************

        srcToken: (state: IState): IAsset => state[Field.srcToken],
        dstToken: (state: IState): IAsset => state[Field.dstToken],

        // ****************************************************
        // * =================== AMOUNTS =================== *
        // ****************************************************

        srcAmount: (state: IState): string => state[Field.srcAmount],
        dstAmount: (state: IState): string => state[Field.dstAmount],

        // ****************************************************
        // * =================== RECEIVER ADDRESS =================== *
        // ****************************************************

        receiverAddress: (state: IState): string => state[Field.receiverAddress],

        // ****************************************************
        // * =================== OTHER =================== *
        // ****************************************************

        contractAddress: (state: IState): string => state[Field.contractAddress],
        contractCallCount: (state: IState): number => state[Field.contractCallCount],

        funds: (state: IState): any => state[Field.funds],

        switchDirection: (state: IState): boolean => state[Field.switchDirection],

        memo: (state: IState): string => state[Field.memo],

        getOperationResultByModule:
            (state: IState) =>
            (module: ModuleType): any => {
                if (!state.operationResult || !state.operationResult[module]) return null;

                return state.operationResult[module];
            },

        getFieldValue: (state: IState) => (field: Field) => {
            if (!state[field]) return null;

            return state[field];
        },

        slippage: (state: IState): number => state[Field.slippage] || 0.5,

        isInput: (state: IState): boolean => state.isInput || false,

        selectedPool: (state: IState): any => state.selectedPool,
    },

    mutations: {
        // ===============================
        // =========== AMOUNTS ===========
        // ===============================
        [TYPES.SET_SRC_AMOUNT](state: IState, value: string) {
            state[Field.srcAmount] = value;
        },
        [TYPES.SET_DST_AMOUNT](state: IState, value: string) {
            state[Field.dstAmount] = value;
        },

        // ===============================
        // =========== TOKENS ===========
        // ===============================
        [TYPES.SET_SRC_TOKEN](state: IState, value: IAsset) {
            state[Field.srcToken] = value;
        },

        [TYPES.SET_DST_TOKEN](state: IState, value: IAsset) {
            state[Field.dstToken] = value;
        },

        // ===============================
        // =========== NETWORKS ==========
        // ===============================
        [TYPES.SET_SRC_NETWORK](state: IState, value: INetwork) {
            state[Field.srcNetwork] = value;
        },
        [TYPES.SET_DST_NETWORK](state: IState, value: INetwork) {
            state[Field.dstNetwork] = value;
        },

        // ========================================
        // =========== RECEIVER ADDRESS ===========
        // ========================================
        [TYPES.SET_RECEIVER_ADDRESS](state: IState, value: string) {
            state[Field.receiverAddress] = value;
        },

        // ===============================
        // =========== OTHER ===========
        // ===============================
        [TYPES.SET_ONLY_BALANCE](state: IState, value: boolean) {
            state.onlyWithBalance = value;
        },
        [TYPES.SET_DIRECTION](state: IState, value: keyof typeof DIRECTIONS) {
            state.direction = value;
        },

        [TYPES.SET_TOKEN_SELECT_TYPE](state: IState, value: keyof typeof TOKEN_SELECT_TYPES) {
            state.selectType = value;
        },

        [TYPES.SET_OPERATION_RESULT](state: IState, { module, result }) {
            !state.operationResult && (state.operationResult = {});
            state.operationResult[module] = result;
        },

        [TYPES.SET_MEMO](state: IState, value: string) {
            state[Field.memo] = value;
        },

        [TYPES.RESET_SRC_BALANCE_FOR_ACCOUNT](state) {
            state.srcToken = state.srcToken ? { ...state.srcToken, balance: null } : null;
        },

        [TYPES.RESET_ALL_FIELDS]: (state: IState) => {
            for (const field in Field) if (Object.prototype.hasOwnProperty.call(Field, field)) state[field] = null;
        },

        [TYPES.SET_VALUE_BY_MODULE](state: IState, { module, field, value }) {
            state[module][field] = value;
        },

        [TYPES.SET_CALL_CONFIRM](state: IState, { module, value }) {
            state.isForceCallConfirm[module] = value;
        },

        [TYPES.SET_SERVICE_ID](state: IState, { module, value }) {
            state.serviceId[module] = value;
        },
        [TYPES.SET_CONTRACT_ADDRESS](state: IState, value: string) {
            state[Field.contractAddress] = value;
        },
        [TYPES.SET_CONTRACT_CALL_COUNT](state: IState, value: number) {
            state[Field.contractCallCount] = value;
        },

        [TYPES.SET_FUNDS](state: IState, value: any) {
            state[Field.funds] = value;
        },

        [TYPES.SET_SLIPPAGE](state: IState, value: number) {
            state[Field.slippage] = value;
        },

        [TYPES.SET_IS_INPUT](state: IState, value: boolean) {
            state.isInput = value;
        },

        [TYPES.SET_SELECTED_POOL](state: IState, value: any) {
            state.selectedPool = value;
        },
    },

    actions: {
        setSrcAmount({ commit }, value) {
            commit(TYPES.SET_SRC_AMOUNT, value);
        },
        setDstAmount({ commit }, value) {
            commit(TYPES.SET_DST_AMOUNT, value);
        },
        setSrcToken({ commit }, value) {
            commit(TYPES.SET_SRC_TOKEN, value);
        },
        setDstToken({ commit }, value) {
            commit(TYPES.SET_DST_TOKEN, value);
        },
        setSrcNetwork({ commit }, value) {
            commit(TYPES.SET_SRC_NETWORK, value);
        },
        setDstNetwork({ commit }, value) {
            commit(TYPES.SET_DST_NETWORK, value);
        },
        setReceiverAddress({ commit }, value) {
            commit(TYPES.SET_RECEIVER_ADDRESS, value);
        },
        setOnlyWithBalance({ commit }, value) {
            commit(TYPES.SET_ONLY_BALANCE, value);
        },
        setDirection({ commit }, value) {
            commit(TYPES.SET_DIRECTION, value);
        },
        setSelectType({ commit }, value) {
            commit(TYPES.SET_TOKEN_SELECT_TYPE, value);
        },
        setSelectedService({ commit }, value) {
            commit(TYPES.SET_SELECTED_SERVICE, value);
        },
        setOperationResult({ commit }, value) {
            commit(TYPES.SET_OPERATION_RESULT, value);
        },
        resetOperationResult({ commit }, value) {
            commit(TYPES.SET_OPERATION_RESULT, { module: value, result: null });
        },
        setMemo({ commit }, value) {
            commit(TYPES.SET_MEMO, value);
        },
        resetSrcBalanceForAccount({ commit }) {
            commit(TYPES.RESET_SRC_BALANCE_FOR_ACCOUNT);
        },
        resetFields({ commit }) {
            commit(TYPES.RESET_ALL_FIELDS);
        },

        setFieldValue({ commit }, { field, value }) {
            if (!fieldSetter[field]) return;

            commit(fieldSetter[field], value);
        },

        setValueByModule({ commit }, { module, field, value }) {
            commit(TYPES.SET_VALUE_BY_MODULE, { module, field, value });
        },

        setCallConfirm({ commit }, { module, value }) {
            commit(TYPES.SET_CALL_CONFIRM, { module, value });
        },

        setServiceId({ commit }, { module, value }) {
            commit(TYPES.SET_SERVICE_ID, { module, value });
        },
        setContractAddress({ commit }, value: string) {
            commit(TYPES.SET_CONTRACT_ADDRESS, value);
        },
        setContractCallCount({ commit }, value: number) {
            commit(TYPES.SET_CONTRACT_CALL_COUNT, value);
        },
        setFunds({ commit }, value: { amount: string; denom: string }) {
            commit(TYPES.SET_FUNDS, value);
        },

        setSlippage({ commit }, value: number) {
            slippageFromStore.value = value;
            commit(TYPES.SET_SLIPPAGE, value);
        },

        setIsInput({ commit }, value: boolean) {
            commit(TYPES.SET_IS_INPUT, value);
        },

        setSelectedPool({ commit }, value: any) {
            commit(TYPES.SET_SELECTED_POOL, value);
        },
    },
};
