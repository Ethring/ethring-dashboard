import { ModuleType } from '@/modules/bridge-dex/enums/ServiceType.enum';
import _ from 'lodash';

const TYPES = {
    SET_DISABLED_FIELD: 'SET_DISABLED_FIELD',
};

enum Field {
    srcNetwork = 'srcNetwork',
    srcToken = 'srcToken',
    dstNetwork = 'dstNetwork',
    dstToken = 'dstToken',
    direction = 'direction',
    onlyWithBalance = 'onlyWithBalance',
    receiverAddress = 'receiverAddress',
    srcAmount = 'srcAmount',
    dstAmount = 'dstAmount',
    memo = 'memo',
    swapDirection = 'swapDirection',
}

enum FieldProps {
    disabled = 'disabled',
}

interface IFieldState {
    [FieldProps.disabled]: boolean;
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
}

export default {
    namespaced: true,

    state: () => ({
        [ModuleType.swap]: {
            [Field.srcNetwork]: {
                [FieldProps.disabled]: false,
            },
            [Field.srcToken]: {
                [FieldProps.disabled]: false,
            },
            [Field.dstToken]: {
                [FieldProps.disabled]: false,
            },
            [Field.srcAmount]: {
                [FieldProps.disabled]: false,
            },
            [Field.dstAmount]: {
                [FieldProps.disabled]: false,
            },
        },

        [ModuleType.bridge]: {
            [Field.srcNetwork]: {
                [FieldProps.disabled]: false,
            },
            [Field.srcToken]: {
                [FieldProps.disabled]: false,
            },
            [Field.dstNetwork]: {
                [FieldProps.disabled]: false,
            },
            [Field.dstToken]: {
                [FieldProps.disabled]: false,
            },
            [Field.direction]: {
                [FieldProps.disabled]: false,
            },
            [Field.onlyWithBalance]: {
                [FieldProps.disabled]: false,
            },
            [Field.receiverAddress]: {
                [FieldProps.disabled]: false,
            },
            [Field.srcAmount]: {
                [FieldProps.disabled]: false,
            },
            [Field.dstAmount]: {
                [FieldProps.disabled]: false,
            },
            [Field.swapDirection]: {
                [FieldProps.disabled]: false,
            },
        },
        [ModuleType.superSwap]: {
            [Field.srcNetwork]: {
                [FieldProps.disabled]: false,
            },
            [Field.srcToken]: {
                [FieldProps.disabled]: false,
            },
            [Field.dstNetwork]: {
                [FieldProps.disabled]: false,
            },
            [Field.dstToken]: {
                [FieldProps.disabled]: false,
            },
            [Field.direction]: {
                [FieldProps.disabled]: false,
            },
            [Field.onlyWithBalance]: {
                [FieldProps.disabled]: false,
            },
            [Field.receiverAddress]: {
                [FieldProps.disabled]: false,
            },
            [Field.srcAmount]: {
                [FieldProps.disabled]: false,
            },
            [Field.dstAmount]: {
                [FieldProps.disabled]: false,
            },
            [Field.swapDirection]: {
                [FieldProps.disabled]: false,
            },
        },
        [ModuleType.send]: {
            [Field.srcNetwork]: {
                [FieldProps.disabled]: false,
            },

            [Field.srcToken]: {
                [FieldProps.disabled]: false,
            },
            [Field.receiverAddress]: {
                [FieldProps.disabled]: false,
            },
            [Field.srcAmount]: {
                [FieldProps.disabled]: false,
            },
        },
        [ModuleType.stake]: {
            [Field.srcNetwork]: {
                [FieldProps.disabled]: false,
            },
            [Field.srcToken]: {
                [FieldProps.disabled]: false,
            },
            [Field.srcAmount]: {
                [FieldProps.disabled]: false,
            },
            [Field.receiverAddress]: {
                [FieldProps.disabled]: false,
            },
            [Field.memo]: {
                [FieldProps.disabled]: false,
            },
        },
    }),

    getters: {
        getDisabledField: (state: IState) => (module: ModuleType, field: Field) => {
            if (!state[module] || !state[module][field]) {
                return false;
            }

            return state[module][field][FieldProps.disabled];
        },

        getFieldsForModule: (state: IState) => (module: ModuleType) => {
            if (!state[module]) {
                return {};
            }

            return state[module];
        },
    },

    mutations: {
        [TYPES.SET_DISABLED_FIELD](
            state: IState,
            { module, field, props, value }: { module: ModuleType; field: Field; props: FieldProps; value: boolean },
        ) {
            !state[module] && (state[module] = {});
            !state[module][field] && (state[module][field] = {});

            if (props === FieldProps.disabled) {
                state[module][field][props] = state[module][field][props] || value;
            }

            state[module][field][props] = value;
        },
    },

    actions: {
        setDisabledField(
            { commit }: any,
            { module, field, props, value }: { module: ModuleType; field: Field; props: FieldProps; value: boolean },
        ) {
            commit(TYPES.SET_DISABLED_FIELD, { module, field, props, value });
        },
    },
};
