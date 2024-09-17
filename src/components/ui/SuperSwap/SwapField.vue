<template>
    <div class="swap-field" :class="{ focused }">
        <div class="row">
            <h3 class="label">{{ label }}</h3>
            <div class="row select-row">
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

        <div class="swap-field-input-container">
            <a-skeleton-input v-if="isAmountLoading" active class="input-balance input-balance-skeleton" size="" />
            <a-input
                v-else
                v-model:value="amount"
                v-debounce:0.3s="onInput"
                type="text"
                data-qa="input-amount"
                class="base-input input-balance"
                :class="{ disabled }"
                :bordered="false"
                :placeholder="placeholder"
                :disabled="disabled || label === 'To'"
                @focus="focused = true"
                @blur="onBlur"
                @keypress="onKeyPressHandler"
            />
        </div>

        <div class="balance-info" :class="{ disabled, error }">
            <div class="balance-price">
                <a-skeleton-input v-if="isAmountLoading" active size="small" class="balance-skeleton" />
                <Amount v-else :value="payTokenPrice || 0" :decimals="3" type="usd" symbol="$" />

                <span
                    v-if="!isAmountLoading && percentage && !isNaN(percentage)"
                    class="percentage"
                    :class="{ 'percentage-minus': percentage < 0 }"
                >
                    (<span>{{ percentage }}%</span>)
                </span>
            </div>

            <div class="balance-value">
                <a-skeleton-input v-if="isTokenLoading" active size="small" class="balance-skeleton" />
                <div v-else-if="!isTokenLoading && token" class="balance-value-row" @click.stop="setMax">
                    <span class="balance-label"> {{ $t('tokenOperations.balance') }}: </span>
                    <Amount :value="token?.balance || 0" :decimals="3" type="currency" :symbol="token?.symbol" />
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import { ref, watch, computed } from 'vue';
import { useStore } from 'vuex';

import Amount from '@/components/app/Amount';

import BigNumber from 'bignumber.js';

import { formatNumber } from '@/shared/utils/numbers';
import { formatInputNumber } from '@/shared/utils/input';

export default {
    name: 'SwapField',
    components: { Amount },
    props: {
        label: {
            type: String,
            required: true,
            default: 'From',
        },
        name: {
            type: String,
            required: true,
            default: 'srcAmount',
        },
        value: {
            type: [String, Number],
            required: false,
            default: '' || 0,
        },
        token: {
            type: [Object, null],
            required: true,
            default: () => ({}),
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
            type: [Number, String],
            required: false,
            default: 0,
        },
    },
    emits: ['setAmount'],
    setup(props, { emit }) {
        const store = useStore();

        const isInput = computed({
            get: () => store.getters['tokenOps/isInput'],
            set: (value) => store.dispatch('tokenOps/setIsInput', value),
        });

        const amount = ref(props.value);

        const placeholder = ref('0');
        const focused = ref(false);
        const error = ref(false);
        const symbolForReplace = ref(null);

        const setMax = () => {
            if (props.hideMax) return;

            amount.value = props.token?.balance;
            emit('setAmount', BigNumber(props.token?.balance).toFixed());
        };

        const onInput = () => {
            emit('setAmount', amount.value);
            setTimeout(() => (isInput.value = false), 400);
        };

        const checkBalanceAllowed = () => {
            if (props.hideMax) return;

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
            if (e.code === 'Period' || e.code === 'Comma') symbolForReplace.value = e.key;
        };

        const selectedToken = computed(() => props.token);

        const payTokenPrice = computed(() => BigNumber(amount.value * +selectedToken.value?.price || 0).toFixed() || 0);

        watch(amount, (val) => {
            isInput.value = true;

            if (val) {
                if (symbolForReplace.value) val = val.toString().replace(symbolForReplace.value, '.');

                amount.value = formatInputNumber(val);

                setTimeout(() => (isInput.value = false), 400);

                return checkBalanceAllowed();
            }

            error.value = false;
        });

        watch(
            () => props.value,
            () => {
                amount.value = props.value;
                emit('setAmount', amount.value);
            },
        );

        watch(
            () => props.token,
            () => {
                checkBalanceAllowed();
            },
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

    display: flex;
    flex-direction: column;
    justify-content: space-between;

    background: var(--#{$prefix}select-bg-color);
    border-radius: 8px;
    height: 136px;

    padding: 8px 8px 16px 16px;

    box-sizing: border-box;
    border: 1px solid transparent;

    transition: all 0.2s ease-in-out;

    cursor: pointer;

    &.focused {
        border: 1px solid var(--#{$prefix}select-active-border-color);
        background: var(--#{$prefix}select-bg-color);
    }

    .row,
    .select-row {
        @include pageFlexRow;
        justify-content: flex-end;
        width: 100%;

        & > h3 {
            width: 30%;
        }
    }

    .row.select-row {
        width: 100%;
        gap: 10px;
    }

    .token-skeleton {
        height: 40px;
    }

    .label {
        color: var(--#{$prefix}select-label-color);
        font-size: var(--#{$prefix}default-fs);
        font-weight: 400;
        cursor: default;
    }

    .swap-field-input-container {
        width: 100%;
        margin: 4px 0;
    }

    .input-balance {
        min-height: 32px;
        max-height: 32px;

        text-align: left !important;

        padding-left: 0;
    }

    .disabled {
        color: var(--#{$prefix}input-disabled-text);
        cursor: not-allowed;
        user-select: none;
    }
}
</style>
