import _ from 'lodash';

import { Field, FieldAttr } from '@/shared/models/enums/fields.enum';
import { IFieldState } from '@/shared/models/fields/module-fields';
import { ModuleType } from '@/shared/models/enums/modules.enum';

const TYPES = {
    SET_BOOLEAN_FIELD: 'SET_BOOLEAN_FIELD',
    RESET_FIELDS: 'RESET_FIELDS',

    SET_IS_NEED_INPUT_FOCUS: 'SET_IS_NEED_INPUT_FOCUS',
};

class FieldState implements IFieldState {
    [FieldAttr.disabled] = false;
    [FieldAttr.hide] = false;
}

interface IState {
    [ModuleType.send]: {
        [key in Field]: IFieldState;
    };
    [ModuleType.superSwap]: {
        [key in Field]: IFieldState;
    };
    [ModuleType.swap]: {
        [key in Field]: IFieldState;
    };
    [ModuleType.bridge]: {
        [key in Field]: IFieldState;
    };
    [ModuleType.stake]: {
        [key in Field]: IFieldState;
    };
    [ModuleType.nft]: {
        [key in Field]: IFieldState;
    };

    [ModuleType.shortcut]: {
        [key in Field]: IFieldState;
    }

    isNeedInputFocus: boolean;
}

export default {
    namespaced: true,

    state: () => ({
        [ModuleType.swap]: {
            [Field.srcNetwork]: new FieldState(),
            [Field.srcToken]: new FieldState(),
            [Field.dstToken]: new FieldState(),
            [Field.srcAmount]: new FieldState(),
            [Field.dstAmount]: new FieldState(),
        },

        [ModuleType.bridge]: {
            [Field.srcNetwork]: new FieldState(),
            [Field.srcToken]: new FieldState(),
            [Field.dstNetwork]: new FieldState(),
            [Field.dstToken]: new FieldState(),
            [Field.receiverAddress]: new FieldState(),
            [Field.srcAmount]: new FieldState(),
            [Field.dstAmount]: new FieldState(),
            [Field.switchDirection]: new FieldState(),
        },
        [ModuleType.superSwap]: {
            [Field.srcNetwork]: new FieldState(),
            [Field.srcToken]: new FieldState(),
            [Field.dstNetwork]: new FieldState(),
            [Field.dstToken]: new FieldState(),
            [Field.receiverAddress]: new FieldState(),
            [Field.srcAmount]: new FieldState(),
            [Field.dstAmount]: new FieldState(),
            [Field.switchDirection]: new FieldState(),
            [Field.isReload]: new FieldState(),
        },
        [ModuleType.send]: {
            [Field.srcNetwork]: new FieldState(),

            [Field.srcToken]: new FieldState(),
            [Field.receiverAddress]: new FieldState(),
            [Field.srcAmount]: new FieldState(),
        },
        [ModuleType.stake]: {
            [Field.srcNetwork]: new FieldState(),
            [Field.srcToken]: new FieldState(),
            [Field.srcAmount]: new FieldState(),
            [Field.receiverAddress]: new FieldState(),
            [Field.memo]: new FieldState(),
        },
        [ModuleType.nft]: {
            [Field.srcNetwork]: new FieldState(),
            [Field.srcToken]: new FieldState(),
            [Field.srcAmount]: new FieldState(),
            [Field.contractAddress]: new FieldState(),
            [Field.contractCallCount]: new FieldState(),
        },

        [ModuleType.shortcut]: {
            [Field.srcNetwork]: new FieldState(),
            [Field.srcToken]: new FieldState(),
            [Field.dstNetwork]: new FieldState(),
            [Field.dstToken]: new FieldState(),
            [Field.srcAmount]: new FieldState(),
            [Field.dstAmount]: new FieldState(),
            [Field.switchDirection]: new FieldState(),
            [Field.isReload]: new FieldState(),
            [Field.receiverAddress]: new FieldState(),
            [Field.memo]: new FieldState(),
            [Field.contractAddress]: new FieldState(),
            [Field.contractCallCount]: new FieldState(),
        },

        isNeedInputFocus: true,
    }),

    getters: {
        getDisabledField: (state: IState) => (module: ModuleType, field: Field) => {
            if (!state[module] || !state[module][field]) {
                return false;
            }

            return state[module][field][FieldAttr.disabled];
        },

        getFieldsForModule: (state: IState) => (module: ModuleType) => {
            if (!state[module]) {
                return {};
            }

            return state[module];
        },

        getDisabledFieldsForModule: (state: IState) => (module: ModuleType) => {
            if (!state[module]) {
                return {};
            }

            return _.pickBy(state[module], (field: IFieldState) => field[FieldAttr.disabled]);
        },

        getIsNeedInputFocus: (state: IState) => state.isNeedInputFocus,
    },

    mutations: {
        [TYPES.SET_BOOLEAN_FIELD](
            state: IState,
            { module, field, attr, value }: { module: ModuleType; field: Field; attr: FieldAttr; value: any },
        ) {
            !state[module] && (state[module] = {});
            !state[module][field] && (state[module][field] = {});

            if (attr in state[module][field] && state[module][field][attr] === value) {
                return;
            }

            state[module][field][attr] = value;
        },
        [TYPES.RESET_FIELDS](state: IState, { module }: { module: ModuleType }) {
            if (!state[module]) {
                return;
            }

            for (const key in state[module]) {
                state[module][key] = new FieldState();
            }
        },

        [TYPES.SET_IS_NEED_INPUT_FOCUS](state: IState, value: boolean) {
            state.isNeedInputFocus = value;
        },
    },

    actions: {
        setDisabledField(
            { commit }: any,
            { module, field, attr, value }: { module: ModuleType; field: Field; attr: FieldAttr; value: boolean },
        ) {
            commit(TYPES.SET_BOOLEAN_FIELD, { module, field, attr, value });
        },

        setHideField(
            { commit }: any,
            { module, field, attr, value }: { module: ModuleType; field: Field; attr: FieldAttr; value: boolean },
        ) {
            commit(TYPES.SET_BOOLEAN_FIELD, { module, field, attr, value });
        },

        resetModuleStates({ commit }: any, { module }: { module: ModuleType }) {
            commit(TYPES.RESET_FIELDS, { module });
        },

        setIsNeedInputFocus({ commit }: any, value: boolean) {
            commit(TYPES.SET_IS_NEED_INPUT_FOCUS, value);
        },
    },
};
