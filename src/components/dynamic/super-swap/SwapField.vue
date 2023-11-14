<template>
    <div class="swap-field" :class="{ focused }">
        <div class="row">
            <h2 class="label">{{ label }}</h2>
            <div class="row">
                <template v-if="isTokenLoading">
                    <a-space>
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
                <a-skeleton-input active class="skeleton" />
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
            <p v-else>
                $
                <span>{{ formatNumber(+token?.price * +amount, 4) }}</span>
                <span class="percentage" v-if="percentage && !isNaN(percentage)">({{ percentage }} %)</span>
            </p>
            <p @click.stop="setMax" v-if="!hideMax && !isTokenLoading && token" class="balance__value" :class="{ error }">
                {{ $t('tokenOperations.balance') }}:
                <span>
                    {{ formatNumber(token?.balance) }}
                </span>
                {{ token?.symbol }}
            </p>
            <a-skeleton-input v-if="!hideMax && isTokenLoading" active />
        </div>
    </div>
</template>
<script>
import { ref, watch } from 'vue';

import BigNumber from 'bignumber.js';

import { formatNumber } from '@/helpers/prettyNumber';
import { formatInputNumber } from '@/helpers/numbers';

export default {
    name: 'SwapField',
    components: {},
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
    padding: 12px 16px;
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

    .label {
        color: var(--#{$prefix}select-label-color);
        font-size: var(--#{$prefix}default-fs);
        font-weight: 500;
        cursor: default;
    }

    .input-balance {
        width: 100%;
        text-align: left;
        border: none;
        outline: none;
        background-color: transparent;
        font-size: var(--#{$prefix}h4-fs);
        font-weight: 600;
        height: 32px;
        color: var(--#{$prefix}primary-text);
        margin-top: 4px;
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
        margin-top: 6px;
        font-size: var(--#{$prefix}small-lg-fs);
        cursor: default;

        span {
            font-weight: 600;
            font-size: var(--#{$prefix}small-lg-fs);
            color: var(--#{$prefix}sub-text);
        }

        h4 {
            font-weight: 600;
            color: var(--#{$prefix}base-text);
            font-size: var(--#{$prefix}small-lg-fs);
            line-height: 21px;
            cursor: default;

            span {
                font-size: var(--#{$prefix}small-lg-fs);
                color: var(--#{$prefix}base-text);
                font-weight: 400;
            }
        }

        &__value {
            cursor: pointer;
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
