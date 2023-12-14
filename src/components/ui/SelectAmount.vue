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

            <div class="balance" :class="{ disabled, error }">
                <div class="balance-value">
                    <template v-if="isTokenLoading">
                        <a-skeleton-input active size="small" class="balance-skeleton" />
                    </template>

                    <div v-else @click.stop="setMax">
                        {{ $t('tokenOperations.balance') }}:
                        <p><NumberTooltip :value="selectedToken?.balance || 0" decimals="3" /></p>
                        {{ selectedToken?.symbol }}
                    </div>
                </div>
                <div class="balance-price">
                    <template v-if="isAmountLoading">
                        <a-skeleton-input active size="small" class="balance-price-skeleton" />
                    </template>
                    <template v-else>
                        <span>$</span>
                        <NumberTooltip :value="payTokenPrice" />
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import { ref, watch, computed, onUpdated } from 'vue';

import BigNumber from 'bignumber.js';

import TokenIcon from '@/components/ui/TokenIcon';
import NumberTooltip from '@/components/ui/NumberTooltip';

import ArrowIcon from '@/assets/icons/dashboard/arrow.svg';

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
            default: {},
        },
    },
    components: {
        ArrowIcon,
        TokenIcon,
        NumberTooltip,
    },
    setup(props, { emit }) {
        const active = ref(false);
        const focused = ref(false);
        const symbolForReplace = ref(null);

        const amount = ref(props.amountValue || '');

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

        const resetAmount = () => {
            if (props.onReset) {
                amount.value = null;
                active.value = false;
                return emit('setAmount', null);
            }
        };

        watch(
            () => props.amountValue,
            () => {
                amount.value = props.amountValue;
                active.value = false;
                // emit('setAmount', amount.value);
            }
        );

        watch(
            () => props.onReset,
            () => resetAmount()
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
                if (tkn?.id === oldTkn?.id || tkn?.address === oldTkn?.address) {
                    return;
                }

                if (tkn) {
                    setToken(tkn);
                    amount.value = props.amountValue;
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

                return (payTokenPrice.value = BigNumber(amount.value * +selectedToken?.value?.price || 0).toFixed() || 0);
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

            return (payTokenPrice.value = BigNumber(amount.value).multipliedBy(selectedToken?.value?.price || 0) || 0);
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

        onUpdated(() => {
            resetAmount();
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
            onFocus,
            clickAway,
            emit,
            clickToken,
            coingeckoPrice,
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
        height: 104px;
        padding: 12px 16px;
        box-sizing: border-box;
        border: 1px solid transparent;

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
            position: relative;
            height: 32px;
            max-height: 32px;

            &-value,
            &-price {
                position: relative;
                color: var(--#{$prefix}select-label-color);
                font-size: var(--#{$prefix}small-lg-fs);

                &-skeleton {
                    position: absolute;
                    right: 0px;
                    top: -12px;
                }
            }

            &-skeleton {
                margin-top: 0px;
            }

            &-value {
                cursor: pointer;
                margin-top: 3px;
                div {
                    @include pageFlexRow;
                    align-items: flex-end;
                }

                p {
                    font-weight: 500;
                    font-size: var(--#{$prefix}default-fs);
                    color: var(--#{$prefix}balance-text);
                    margin: 0 3px 0 6px;
                }
            }

            &-price {
                font-weight: 500;
                color: var(--#{$prefix}balance-text);
                cursor: default;

                span {
                    color: var(--#{$prefix}base-text);
                    font-weight: 400;
                    margin-right: -3px;
                }
            }

            &.error {
                .balance-value * {
                    color: var(--#{$prefix}danger) !important;
                }
            }
        }

        .disabled * {
            cursor: not-allowed;
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
            font-weight: 700;
            color: var(--#{$prefix}select-item-secondary-color);
            margin-right: 12px;

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
            width: 100%;
            text-align: right;
            min-width: 100px;
            border: none;
            outline: none;
            background: transparent;
            font-size: var(--#{$prefix}h4-fs);
            font-weight: 700;
            color: var(--#{$prefix}primary-text);

            &::placeholder {
                color: var(--#{$prefix}select-placeholder-text);
            }

            &:disabled {
                color: var(--#{$prefix}input-disabled-text);
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

            width: 32px;
            height: 32px;
            border-radius: 50%;
            margin-right: 6px;

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
            @include animateEasy;
            stroke-width: 2px;
            stroke: var(--#{$prefix}select-icon-color);
        }
    }

    &.focused {
        .select-amount__panel {
            border: 1px solid var(--#{$prefix}select-active-border-color);
            background: var(--#{$prefix}select-bg-color);
        }
    }

    &.active {
        .select-amount__panel {
            border: 1px solid var(--#{$prefix}select-active-border-color);
            background: var(--#{$prefix}white);

            svg.arrow {
                transform: rotate(180deg);
            }
        }
    }
}
</style>
