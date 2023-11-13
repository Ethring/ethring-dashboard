<template>
    <div :class="{ active, focused }" class="select-amount" @click="setActive">
        <div class="select-amount__panel">
            <div class="label">{{ label }}</div>
            <div class="info-wrap">
                <div class="info" @click="clickToken" data-qa="select-token">
                    <template v-if="isTokenLoading">
                        <a-space>
                            <a-skeleton-avatar active />
                            <a-skeleton-input active size="small" />
                        </a-space>
                    </template>
                    <template v-else>
                        <div class="network">
                            <TokenIcon width="24" height="24" :token="selectedToken" />
                        </div>

                        <div class="token" v-if="selectedToken">{{ selectedToken?.symbol }}</div>
                        <div class="token placeholder" v-else>{{ $t(selectPlaceholder) }}</div>

                        <ArrowIcon class="arrow" />
                    </template>
                </div>

                <template v-if="isAmountLoading">
                    <a-skeleton-input active class="input-balance" size="small" />
                </template>

                <template v-else>
                    <input
                        v-model="amount"
                        :placeholder="placeholder"
                        :disabled="disabled"
                        @focus="onFocus"
                        type="text"
                        v-debounce:1s="onInput"
                        @blur="onBlur"
                        @keypress="onKeyPressHandler"
                        @click.stop="() => {}"
                        data-qa="input-amount"
                        class="input-balance"
                        :class="{ disabled }"
                    />
                </template>
            </div>

            <div class="balance" :class="{ disabled, error }" @click.stop="setMax">
                <div class="balance-value">
                    <template v-if="isTokenLoading">
                        <a-skeleton-input active size="small" />
                    </template>
                    <template v-else>
                        <p class="balance-value">
                            {{ $t('tokenOperations.balance') }}:
                            <span>
                                {{ setTokenBalance(selectedToken) }}
                            </span>
                            {{ selectedToken?.symbol }}
                        </p>
                    </template>
                </div>
                <div class="balance-price">
                    <template v-if="isAmountLoading">
                        <a-skeleton-input active size="small" />
                    </template>
                    <template v-else> <span>$</span>{{ payTokenPrice }} </template>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import { ref, watch, computed } from 'vue';

import BigNumber from 'bignumber.js';

import TokenIcon from '@/components/ui/TokenIcon';

import ArrowIcon from '@/assets/icons/dashboard/arrowdowndropdown.svg';

import { prettyNumber, formatNumber } from '@/helpers/prettyNumber';

import { formatInputNumber } from '@/helpers/numbers';

export default {
    name: 'SelectAmount',
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
    },
    components: {
        ArrowIcon,
        TokenIcon,
    },
    setup(props, { emit }) {
        const active = ref(false);
        const focused = ref(false);
        const symbolForReplace = ref(null);

        const amount = ref('');

        const payTokenPrice = ref(0);

        const selectPlaceholder = computed(() => {
            if (!props.value) {
                return 'tokenOperations.select';
            }

            return '';
        });

        const selectedToken = computed({
            get: () => props.value,
            set: (value) => emit('setToken', value),
        });

        const placeholder = ref('0');
        const coingeckoPrice = ref(0);

        watch(
            () => props.onReset,
            () => {
                if (props.onReset) {
                    amount.value = '';
                    active.value = false;
                    emit('setAmount', amount.value);
                }
            }
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
            () => props.value,
            (tkn, oldTkn) => {
                console.log(tkn, oldTkn, '--tkn, oldTkn');
                if (tkn?.id === oldTkn?.id || tkn?.address === oldTkn?.address) {
                    return;
                }
                console.log('----1');
                if (tkn) {
                    setToken(tkn);
                    amount.value = '';
                    active.value = false;
                    emit('setAmount', amount.value);
                }
            }
        );

        const onKeyPressHandler = (e) => {
            if (e.code === 'Period' || e.code === 'Comma') {
                symbolForReplace.value = e.key;
            }
        };

        watch(amount, (val) => {
            amount.value = val;

            if (val) {
                if (symbolForReplace.value) {
                    val = val.replace(symbolForReplace.value, '.');
                }
                amount.value = formatInputNumber(val);

                return (payTokenPrice.value = formatNumber(BigNumber(amount.value * +selectedToken?.value?.price || 0).toFixed()) || 0);
            }

            // val = val.replace(/[^0-9.]+/g, '').replace(/\.{2,}/g, '.');

            if (val === '' || !val?.toString()) {
                return (payTokenPrice.value = 0);
            }

            val = val
                .toString()
                // remove spaces
                .replace(/\s+/g, '')
                .replace(',', '.')
                // only number
                .replace(/[^.\d]+/g, '')
                // remove extra 0 before decimal
                .replace(/^0+/, '0')
                // remove extra dots
                .replace(/^0+(\d+)/, '$1');

            if (val.indexOf('.') !== val.lastIndexOf('.')) {
                val = val.substr(0, val.lastIndexOf('.'));
            }

            amount.value = val;

            return (payTokenPrice.value = formatNumber(BigNumber(amount.value).multipliedBy(selectedToken?.value?.price || 0)) || 0);
        });

        const clickAway = () => {
            active.value = false;
        };

        const onFocus = () => {
            placeholder.value = '';
            focused.value = true;
        };

        const onInput = () => {
            emit('setAmount', amount.value);
            active.value = false;
        };

        const onBlur = () => {
            placeholder.value = '0';
            focused.value = false;
        };

        const setMax = () => {
            active.value = false;
            if (!props.hideMax) {
                let balance = selectedToken.value?.balance;
                if (balance > 0) {
                    balance = BigNumber(balance).toFixed();
                } else {
                    balance = 0;
                }
                amount.value = balance;
                emit('setAmount', amount.value);
            }
        };

        const setActive = () => {
            if (props.showDropDown) {
                active.value = !active.value;
            }
        };

        const setToken = (item) => {
            selectedToken.value = item;
        };

        const clickToken = () => {
            emit('clickToken');
        };

        const setTokenBalance = (token) => {
            return BigNumber(token?.balance || 0).toFixed();
        };

        return {
            active,
            focused,
            amount,
            placeholder,
            selectedToken,
            prettyNumber,
            selectPlaceholder,

            onKeyPressHandler,
            setToken,
            onBlur,
            setActive,
            setMax,
            onInput,
            onFocus,
            clickAway,
            emit,
            clickToken,
            coingeckoPrice,
            setTokenBalance,
            payTokenPrice,
        };
    },
};
</script>

<style lang="scss" scoped>
.select-amount {
    position: relative;

    & :has(> *.disabled) {
        cursor: not-allowed !important;
    }

    &__panel {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        background: var(--#{$prefix}select-bg-color);
        border-radius: 8px;
        height: 120px;
        padding: 12px 16px;
        box-sizing: border-box;
        border: 2px solid transparent;

        transition: 0.2s;

        cursor: pointer;

        .label {
            @include pageFlexRow;

            color: var(--#{$prefix}select-label-color);
            font-weight: 500;
            max-height: 32px;
            height: 32px;
        }

        .balance {
            @include pageFlexRow;
            justify-content: space-between;

            height: 32px;
            max-height: 32px;

            &-value,
            &-price {
                color: var(--#{$prefix}base-text);
                font-size: var(--#{$prefix}small-md-fs);
            }

            &-value {
                font-weight: 400;

                span {
                    font-weight: 600;
                    font-size: var(--#{$prefix}default-fs);
                    color: var(--#{$prefix}sub-text);
                }
            }

            &-price {
                font-weight: 600;
                color: var(--#{$prefix}sub-text);

                span {
                    color: var(--#{$prefix}base-text);
                    font-weight: 400;
                    margin-right: 2px;
                }
            }

            &.error {
                .balance-value * {
                    color: var(--#{$prefix}danger) !important;
                }
            }
        }

        .info-wrap {
            @include pageFlexRow;
            justify-content: space-between;

            width: 100%;
        }

        .info {
            @include pageFlexRow;
            cursor: pointer;
            width: 100%;
            max-width: 250px;
        }

        .token {
            font-size: var(--#{$prefix}h4-fs);
            font-weight: 600;
            color: var(--#{$prefix}select-item-secondary-color);
            margin-right: 10px;

            display: inline-block;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 170px;
            white-space: nowrap;

            &.placeholder {
                color: var(--#{$prefix}select-placeholder-text);
            }
        }

        .input-balance {
            width: 80%;
            text-align: right;
            min-width: 100px;
            border: none;
            outline: none;
            background: transparent;
            font-size: var(--#{$prefix}h4-fs);
            font-weight: 600;
            color: var(--#{$prefix}primary-text);

            &::placeholder {
                color: var(--#{$prefix}select-placeholder-text);
            }

            &:disabled {
                color: var(--#{$prefix}select-placeholder-text);
                cursor: not-allowed;
                user-select: none;
            }
        }

        .max {
            margin-left: 10px;
            font-size: var(--#{$prefix}h2-fs);
            color: var(--#{$prefix}black);
            font-weight: 600;
        }

        .network {
            display: flex;
            justify-content: center;
            align-items: center;

            width: 40px;
            min-width: 40px;
            height: 40px;

            border-radius: 50%;

            margin-right: 8px;

            svg {
                fill: var(--#{$prefix}black);
            }
        }

        .name {
            font-size: var(--#{$prefix}h2-fs);
            font-weight: 600;
            color: var(--#{$prefix}select-placeholder-text);
            user-select: none;
        }

        svg.arrow {
            cursor: pointer;
            fill: var(--#{$prefix}select-icon-color);
            transform: rotate(0);
            @include animateEasy;
        }
    }

    &.focused {
        .select-amount__panel {
            border: 2px solid var(--#{$prefix}select-active-border-color);
            background: var(--#{$prefix}select-bg-color);
        }
    }

    &.active {
        .select-amount__panel {
            border: 2px solid var(--#{$prefix}select-active-border-color);
            background: var(--#{$prefix}white);

            svg.arrow {
                transform: rotate(180deg);
            }
        }
    }

    &__items {
        z-index: 100;
        background: var(--#{$prefix}white);
        position: absolute;
        left: 0;
        top: 160px;
        width: 100%;
        min-height: 40px;
        border-radius: 16px;
        border: 2px solid var(--#{$prefix}select-active-border-color);
        padding: 20px 25px;
        box-sizing: border-box;
        max-height: 430px;
        overflow-y: auto;

        &::-webkit-scrollbar {
            width: 0px;
            background-color: transparent;
        }
    }

    &__items-item {
        @include pageFlexRow;
        justify-content: space-between;

        min-height: 50px;
        border-bottom: 1px dashed var(--#{$prefix}select-border-color);
        cursor: pointer;
        @include animateEasy;

        &.active {
            .info {
                .name {
                    color: var(--#{$prefix}black);
                    font-weight: 600;
                }
            }
        }

        &:last-child {
            border-bottom: 1px solid transparent;
        }

        .info {
            @include pageFlexRow;

            .name {
                font-size: var(--#{$prefix}default-fs);
                color: var(--#{$prefix}base-text);
                font-weight: 400;
            }
        }

        &:hover {
            .info {
                .name {
                    color: var(--#{$prefix}sub-text);
                }
            }
        }

        .amount {
            color: var(--#{$prefix}black);
            font-weight: 600;

            span {
                color: var(--#{$prefix}black);
                font-weight: 400;
            }
        }
    }
}
</style>
