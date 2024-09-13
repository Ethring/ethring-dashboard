<template>
    <a-form-item :class="{ active, focused }" class="select-amount select-panel" @click="setActive">
        <div class="input-label">{{ label }}</div>

        <a-input-group compact class="input-group">
            <div
                data-qa="select-token"
                class="input-group__select-token"
                :class="{ disabled: disabledSelect }"
                @click="() => $emit('clickToken')"
            >
                <template v-if="isTokenLoading">
                    <a-space>
                        <a-skeleton-avatar active size="small" />
                        <a-skeleton-input active size="small" />
                    </a-space>
                </template>
                <template v-else>
                    <div class="network">
                        <TokenIcon v-if="selectedToken" width="32" height="32" :token="selectedToken" />
                        <a-avatar v-else :size="32"></a-avatar>
                    </div>

                    <div class="token-symbol" :class="{ placeholder: !selectedToken }">
                        <template v-if="selectedToken && selectedToken.symbol">
                            {{ selectedToken?.symbol }}
                        </template>
                        <template v-else>
                            {{ $t(selectPlaceholder) }}
                        </template>
                    </div>

                    <ArrowIcon class="arrow" />
                </template>
            </div>

            <a-skeleton-input v-if="isAmountLoading" active class="input-balance input-balance-skeleton" />
            <a-input
                v-else
                v-model:value="amount"
                v-debounce:1s="onInput"
                type="text"
                data-qa="input-amount"
                class="base-input input-balance"
                :class="{ disabled }"
                :bordered="false"
                :placeholder="placeholder"
                :disabled="disabled"
                @focus="focused = true"
                @blur="onBlur"
                @keypress="onKeyPressHandler"
            />
        </a-input-group>

        <div class="balance-info" :class="{ disabled, disabled: disabledSelect, error }">
            <div class="balance-value">
                <a-skeleton-input v-if="isTokenLoading" active size="small" class="balance-skeleton" />
                <div v-else class="balance-value-row" @click.stop="setMax">
                    <span class="balance-label"> {{ $t('tokenOperations.balance') }}: </span>
                    <Amount
                        :value="selectedToken?.balance || 0"
                        :decimals="selectedToken?.id?.includes('pools') ? selectedToken?.decimals : 3"
                        type="currency"
                        :symbol="selectedToken?.symbol"
                    />
                </div>
            </div>
            <div class="balance-price">
                <a-skeleton-input v-if="isAmountLoading" active size="small" class="balance-skeleton" />
                <Amount v-else :value="payTokenPrice || 0" :decimals="3" type="usd" symbol="$" />
            </div>
        </div>
    </a-form-item>
</template>
<script>
import { ref, watch, computed, onUpdated, onUnmounted } from 'vue';
import { useStore } from 'vuex';

import BigNumber from 'bignumber.js';

import TokenIcon from '@/components/ui/Tokens/TokenIcon';

import ArrowIcon from '@/assets/icons/form-icons/arrow-down-thin.svg';
import Amount from '@/components/app/Amount.vue';

import { formatInputNumber } from '@/shared/utils/input';

export default {
    name: 'SelectAmountInput',
    components: {
        ArrowIcon,
        TokenIcon,
        Amount,
    },
    props: {
        value: {
            required: true,
            type: [Object, null],
            default: () => ({}),
        },
        onReset: {
            type: [Boolean, String],
            default: false,
        },
        error: {
            type: Boolean,
            default: false,
        },
        showDropDown: {
            type: Boolean,
            default: false,
        },
        label: {
            type: String,
            required: true,
        },
        hideMax: {
            type: Boolean,
            default: false,
        },
        isTokenLoading: {
            type: Boolean,
            default: false,
        },
        isAmountLoading: {
            type: Boolean,
            default: false,
        },
        amountValue: {
            type: [String, Number],
            default: '',
        },
        isUpdate: {
            type: Boolean,
            default: false,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        disabledSelect: {
            type: Boolean,
            default: false,
        },
        disabledValue: {
            type: [String, Number],
            default: '',
        },
        selectedNetwork: {
            type: Object,
            default: () => ({}),
        },
    },
    emits: ['setAmount', 'setToken', 'clickToken'],
    setup(props, { emit }) {
        const store = useStore();

        const isInput = computed({
            get: () => store.getters['tokenOps/isInput'],
            set: (value) => store.dispatch('tokenOps/setIsInput', value),
        });

        const active = ref(false);
        const focused = ref(false);
        const placeholder = ref('0');

        const symbolForReplace = ref(null);

        const amount = ref(props.amountValue || '');

        const selectedToken = computed({
            get: () => props.value,
            set: (value) => emit('setToken', value),
        });

        const payTokenPrice = computed(() => BigNumber(amount.value * +selectedToken.value?.price || 0).toFixed() || 0);

        const selectPlaceholder = computed(() =>
            !selectedToken.value && !selectedToken.value?.symbol ? 'tokenOperations.select' : 'tokenOperations.select',
        );

        const onResetAmount = () => {
            if (!props.onReset) return;

            amount.value = null;
            active.value = false;

            return emit('setAmount', null);
        };

        const onKeyPressHandler = (e) => {
            if (e.code === 'Period' || e.code === 'Comma') symbolForReplace.value = e.key;
        };

        const clickAway = () => {
            active.value = false;
        };

        const onInput = () => {
            active.value = false;
            emit('setAmount', amount.value);
        };

        const onBlur = () => {
            placeholder.value = '0';
            return (focused.value = false);
        };

        const setMax = () => {
            active.value = false;
            if (!props.hideMax) {
                amount.value = BigNumber(selectedToken.value?.balance || 0).toFixed();
                emit('setAmount', amount.value);
            }
        };

        const setActive = () => {
            if (props.showDropDown) active.value = !active.value;
        };

        const setToken = (item) => (selectedToken.value = item);

        // =================================================================================================================

        const unWatchAmount = watch(amount, (val) => {
            isInput.value = true;

            amount.value = val;

            if (val === '' || !val?.toString()) {
                isInput.value = false;
                return emit('setAmount', null);
            }

            if (symbolForReplace.value) val = val?.toString().replace(symbolForReplace.value, '.');

            amount.value = formatInputNumber(val);

            return (isInput.value = false);
        });

        watch(
            () => props.amountValue,
            () => {
                active.value = false;
                amount.value = props.amountValue;
                // emit('setAmount', amount.value);
            },
        );

        watch(
            () => props.onReset,
            () => onResetAmount(),
        );

        watch(
            () => props.disabledValue,
            () => {
                amount.value = props.disabledValue;
                active.value = false;
                emit('setAmount', amount.value);
            },
        );

        watch(
            () => props.isUpdate,
            (isUpdate) => {
                if (isUpdate) setToken(props.value);
            },
        );

        watch(
            () => props.selectedNetwork,
            (net, oldNet) => {
                if (net === oldNet) return;

                if (net) active.value = false;
            },
        );

        watch(
            () => props.value,
            (tkn, oldTkn) => {
                if (tkn?.id === oldTkn?.id) return;

                if (tkn) {
                    setToken(tkn);
                    active.value = false;
                    return;
                }

                amount.value = 0;
                return emit('setAmount', null);
            },
        );

        // =================================================================================================================

        onUpdated(() => onResetAmount());

        onUnmounted(() => {
            unWatchAmount();
        });

        return {
            active,
            focused,
            amount,
            placeholder,
            selectedToken,
            selectPlaceholder,

            onKeyPressHandler,
            setToken,
            onBlur,
            setActive,
            setMax,
            onInput,
            clickAway,
            emit,

            payTokenPrice,
        };
    },
};
</script>
