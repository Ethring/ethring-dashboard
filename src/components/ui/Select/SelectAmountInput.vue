<template>
    <a-form-item :class="{ active, focused }" class="select-amount select-panel" @click="setActive">
        <div class="input-label">{{ label }}</div>

        <a-input-group compact class="input-group">
            <div data-qa="select-token" @click="() => $emit('clickToken')" class="input-group__select-token">
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
                type="text"
                data-qa="input-amount"
                class="base-input input-balance"
                :class="{ disabled }"
                :bordered="false"
                :placeholder="placeholder"
                :disabled="disabled"
                v-debounce:1s="onInput"
                @focus="focused = true"
                @blur="onBlur"
            />
        </a-input-group>

        <div class="balance-info" :class="{ disabled, error }">
            <div class="balance-value">
                <a-skeleton-input v-if="isTokenLoading" active size="small" class="balance-skeleton" />
                <div v-else @click.stop="setMax" class="balance-value-row">
                    <span class="balance-label"> {{ $t('tokenOperations.balance') }}: </span>
                    <Amount :value="selectedToken?.balance || 0" :decimals="3" type="currency" :symbol="selectedToken?.symbol" />
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

import BigNumber from 'bignumber.js';

import TokenIcon from '@/components/ui/Tokens/TokenIcon';

import ArrowIcon from '@/assets/icons/dashboard/arrow.svg';
import Amount from '@/components/app/Amount.vue';

import { formatInputNumber } from '@/helpers/numbers';

export default {
    name: 'SelectAmountInput',
    props: {
        value: {
            required: true,
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
        disabledValue: {
            type: [String, Number],
            default: '',
        },
        selectedNetwork: {
            default: () => ({}),
        },
    },
    components: {
        ArrowIcon,
        TokenIcon,
        Amount,
    },
    setup(props, { emit }) {
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

        const selectPlaceholder = computed(() => (!selectedToken.value && !selectedToken.value?.symbol ? 'tokenOperations.select' : ''));

        const onResetAmount = () => {
            if (!props.onReset) {
                return;
            }

            amount.value = null;
            active.value = false;

            return emit('setAmount', null);
        };

        const onKeyPressHandler = (e) => {
            if (e.code === 'Period' || e.code === 'Comma') {
                symbolForReplace.value = e.key;
            }
        };

        const clickAway = () => {
            active.value = false;
        };

        const onInput = () => {
            console.log('onInput', amount.value);
            active.value = false;
            return emit('setAmount', amount.value);
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
            if (props.showDropDown) {
                active.value = !active.value;
            }
        };

        const setToken = (item) => (selectedToken.value = item);

        // =================================================================================================================

        const unWatchAmount = watch(amount, (val) => {
            amount.value = val;

            if (val === '' || !val?.toString()) {
                return emit('setAmount', null);
            }

            if (symbolForReplace.value) {
                val = val.replace(symbolForReplace.value, '.');
            }

            return (amount.value = formatInputNumber(val));
        });

        watch(
            () => props.amountValue,
            () => {
                active.value = false;
                amount.value = props.amountValue;
                // emit('setAmount', amount.value);
            }
        );

        watch(
            () => props.onReset,
            () => onResetAmount()
        );

        watch(
            () => props.disabledValue,
            () => {
                amount.value = props.disabledValue;
                active.value = false;
                emit('setAmount', amount.value);
            }
        );

        watch(
            () => props.isUpdate,
            (isUpdate) => {
                if (isUpdate) {
                    setToken(props.value);
                }
            }
        );

        watch(
            () => props.selectedNetwork,
            (net, oldNet) => {
                if (net === oldNet) {
                    return;
                }

                if (net) {
                    active.value = false;
                }
            }
        );

        watch(
            () => props.value,
            (tkn, oldTkn) => {
                if (tkn?.id === oldTkn?.id) {
                    return;
                }

                if (tkn) {
                    setToken(tkn);
                    active.value = false;
                    return emit('setAmount', amount.value);
                }

                amount.value = 0;
                return emit('setAmount', null);
            }
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
