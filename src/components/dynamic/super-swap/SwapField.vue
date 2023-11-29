<template>
    <div class="swap-field" :class="{ focused }">
        <div class="row">
            <h2 class="label">{{ label }}</h2>
            <div class="row">
                <template v-if="isTokenLoading">
                    <a-space class="token-skeleton">
                        <a-skeleton-avatar active />
                        <a-skeleton-input active />
                    </a-space>
                    <a-space style="margin-left: 10px">
                        <a-skeleton-avatar active />
                        <a-skeleton-input active />
                    </a-space>
                </template>
                <slot v-else />
            </div>
        </div>
        <div>
            <template v-if="isAmountLoading">
                <a-skeleton-input active class="skeleton" size="small" />
            </template>

            <template v-else>
                <input
                    v-model="amount"
                    :placeholder="placeholder"
                    :disabled="disabled"
                    @focus="onFocus"
                    v-debounce:1s="onInput"
                    @keypress="onKeyPressHandler"
                    @blur="onBlur"
                    @click.stop="() => {}"
                    data-qa="input-amount"
                    class="input-balance"
                    :class="{ disabled }"
                />
            </template>
        </div>
        <div class="balance">
            <template v-if="isAmountLoading">
                <a-skeleton-input active size="small" />
            </template>
            <p v-else class="balance__value">
                <span>$</span>
                <NumberTooltip :value="payTokenPrice" />
                <span class="percentage" v-if="percentage && !isNaN(percentage)">({{ percentage }} %)</span>
            </p>
            <p @click.stop="setMax" v-if="!hideMax && !isTokenLoading && token" class="balance__value" :class="{ error }">
                <span>{{ $t('tokenOperations.balance') }}:</span>

                <NumberTooltip :value="token?.balance" decimals="3" />
                <span>{{ token?.symbol }}</span>
            </p>
            <a-skeleton-input v-if="!hideMax && isTokenLoading" active class="balance-skeleton" />
        </div>
    </div>
</template>
<script>
import { ref, watch, computed } from 'vue';

import NumberTooltip from '@/components/ui/NumberTooltip';

import BigNumber from 'bignumber.js';

import { formatNumber } from '@/helpers/prettyNumber';
import { formatInputNumber } from '@/helpers/numbers';

export default {
    name: 'SwapField',
    components: { NumberTooltip },
    props: {
        label: {
            required: true,
            default: 'From',
        },
        value: {
            required: false,
            default: '',
        },
        token: {
            required: true,
            default: {},
        },
        hideMax: {
            type: Boolean,
            required: false,
            default: false,
        },
        disabled: {
            type: Boolean,
            required: false,
            default: false,
        },
        isTokenLoading: {
            type: Boolean,
            default: false,
        },
        isAmountLoading: {
            type: Boolean,
            required: false,
            default: false,
        },
        percentage: {
            required: false,
            default: null,
        },
    },
    setup(props, { emit }) {
        const amount = ref(props.value);

        const placeholder = ref('0');
        const focused = ref(false);
        const error = ref(false);
        const symbolForReplace = ref(null);

        const setMax = () => {
            amount.value = props.token?.balance;
            emit('setAmount', BigNumber(props.token?.balance).toFixed());
        };

        const onInput = () => {
            return emit('setAmount', amount.value);
        };

        const checkBalanceAllowed = () => {
            const isBalanceAllowed = +amount.value > +props.token?.balance;
            error.value = isBalanceAllowed;
        };

        const onFocus = () => {
            placeholder.value = '';
            focused.value = true;
        };

        const onBlur = () => {
            placeholder.value = '0';
            focused.value = false;
        };

        const onKeyPressHandler = (e) => {
            if (e.code === 'Period' || e.code === 'Comma') {
                symbolForReplace.value = e.key;
            }
        };

        const payTokenPrice = computed(() => {
            return +props.token?.price * +amount.value || 0;
        });

        watch(amount, (val) => {
            if (val) {
                if (symbolForReplace.value) {
                    val = val.replace(symbolForReplace.value, '.');
                }

                amount.value = formatInputNumber(val);

                return checkBalanceAllowed();
            }

            error.value = false;
        });

        watch(
            () => props.value,
            (val) => {
                if (!isNaN(val)) {
                    amount.value = val;
                }
            }
        );

        watch(
            () => props.token,
            () => {
                checkBalanceAllowed();
            }
        );

        return {
            amount,
            placeholder,
            payTokenPrice,
            focused,
            error,

            setMax,
            formatNumber,
            onInput,
            onFocus,
            onBlur,
            onKeyPressHandler,
        };
    },
};
</script>
<style lang="scss" scoped>
.swap-field {
    position: relative;
    background: var(--#{$prefix}select-bg-color);
    border-radius: 8px;
    height: 136px;
    padding: 8px 8px 8px 16px;
    box-sizing: border-box;
    border: 1px solid transparent;
    cursor: pointer;

    &.focused {
        border: 1px solid var(--#{$prefix}select-active-border-color);
        background: var(--#{$prefix}select-bg-color);
    }
    .row {
        @include pageFlexRow;
        justify-content: space-between;
    }

    .token-skeleton {
        height: 40px;
    }

    .balance-skeleton {
        margin-top: -16px;
    }

    .label {
        color: var(--#{$prefix}select-label-color);
        font-size: var(--#{$prefix}default-fs);
        font-weight: 400;
        cursor: default;
    }

    .input-balance {
        width: 100%;
        text-align: left;
        border: none;
        outline: none;
        background-color: transparent;
        font-size: var(--#{$prefix}h4-fs);
        font-weight: 700;
        height: 32px;
        color: var(--#{$prefix}primary-text);
        margin-top: 8px;
    }

    .disabled {
        color: var(--#{$prefix}base-text);
    }

    .balance {
        width: 100%;
        @include pageFlexRow;
        justify-content: space-between;
        color: var(--#{$prefix}base-text);
        font-weight: 400;
        margin-top: 12px;
        padding-right: 8px;
        font-size: var(--#{$prefix}small-lg-fs);
        cursor: default;

        &__value {
            cursor: pointer;
            font-weight: 500;
            font-size: var(--#{$prefix}small-lg-fs);
            color: var(--#{$prefix}sub-text);

            span {
                font-size: var(--#{$prefix}small-lg-fs);
                color: var(--#{$prefix}base-text);
                font-weight: 400;
                margin-left: 2px;
            }
        }

        .percentage {
            font-weight: 400;
            margin-left: 2px;
            color: var(--#{$prefix}base-text);
        }
        .error,
        .error * {
            color: var(--#{$prefix}danger) !important;
        }
    }

    .skeleton {
        margin: 10px 0 0;
    }
}
</style>
