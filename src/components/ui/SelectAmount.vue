<template>
    <div :class="{ active, focused, error }" class="select-amount" @click="setActive">
        <div class="select-amount__panel">
            <div class="label">{{ label }}</div>
            <div class="info-wrap">
                <div class="info" @click="clickToken" data-qa="select-token">
                    <div class="network">
                        <TokenIcon width="24" height="24" :token="selectedToken" />
                    </div>
                    <div class="token">{{ selectedToken?.code }}</div>
                    <arrowSvg class="arrow" />
                </div>
                <input
                    v-model="amount"
                    :placeholder="placeholder"
                    :disabled="disabled"
                    @focus="onFocus"
                    v-debounce:1s="onInput"
                    @blur="onBlur"
                    @click.stop="() => {}"
                    data-qa="input-amount"
                    class="input-balance"
                />
            </div>
            <div class="balance" @click.stop="setMax">
                <p>
                    {{ $t('tokenOperations.balance') }}:
                    <span>
                        {{ setTokenBalance(selectedToken) }}
                    </span>
                    {{ selectedToken?.code }}
                </p>
                <div><span>$</span>{{ payTokenPrice }}</div>
            </div>
        </div>
    </div>
</template>
<script>
import { ref, watch } from 'vue';

import BigNumber from 'bignumber.js';

import TokenIcon from '@/components/ui/TokenIcon';

import arrowSvg from '@/assets/icons/dashboard/arrowdowndropdown.svg';

import { prettyNumber } from '@/helpers/prettyNumber';

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
            type: Object,
        },
    },
    components: {
        arrowSvg,
        TokenIcon,
    },
    setup(props, { emit }) {
        const active = ref(false);
        const focused = ref(false);
        const amount = ref('');
        const payTokenPrice = ref(0);
        const selectedToken = ref(props.value);
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
            (val) => {
                if (val) {
                    setToken(val);
                }
            }
        );

        watch(amount, (val) => {
            if (val) {
                // eslint-disable-next-line
                val = val.replace(/[^0-9\.]/g, '');
                if (val.split('.').length - 1 !== 1 && val[val.length - 1] === '.') {
                    return;
                }
                if (val.length === 2 && val[1] !== '.' && val[1] === '0' && val[0] === '0') {
                    amount.value = val[0];
                } else if (val[0] === '0' && val[1] !== '.') {
                    amount.value = BigNumber(val).toFixed();
                } else {
                    amount.value = val;
                }
                payTokenPrice.value = prettyNumber(BigNumber(amount.value * +selectedToken?.value?.latest_price || 0).toFixed()) || 0;
            } else {
                payTokenPrice.value = '0';
            }
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
            emit('setToken', item);
        };

        const clickToken = () => {
            emit('clickToken');
        };

        const setTokenBalance = (token) => {
            return BigNumber(token?.balance).toFixed();
        };

        return {
            BigNumber,
            active,
            focused,
            amount,
            placeholder,
            selectedToken,
            prettyNumber,
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

    &__panel {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        background: var(--#{$prefix}select-bg-color);
        border-radius: 16px;
        height: 160px;
        padding: 17px 32px;
        box-sizing: border-box;
        border: 2px solid transparent;

        transition: 0.2s;

        cursor: pointer;

        .label {
            color: var(--#{$prefix}select-label-color);
            font-weight: 600;
        }

        .balance {
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: var(--#{$prefix}base-text);
            font-weight: 400;
            font-size: var(--#{$prefix}small-lg-fs);
            line-height: 21px;
            span {
                font-weight: 600;
                font-size: var(--#{$prefix}default-fs);
                color: var(--#{$prefix}sub-text);
            }
            div {
                font-weight: 600;
                color: var(--#{$prefix}base-text);
                font-size: var(--#{$prefix}small-lg-fs);
                line-height: 21px;
                span {
                    color: var(--#{$prefix}base-text);
                    font-weight: 400;
                }
            }
        }

        .info-wrap {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .info {
            display: flex;
            align-items: center;
        }

        .token {
            font-size: var(--#{$prefix}h2-fs);
            font-weight: 600;
            color: var(--#{$prefix}select-item-secondary-color);
            margin-right: 10px;
        }

        .input-balance {
            width: 75%;
            text-align: right;
            min-width: 100px;
            border: none;
            outline: none;
            background: transparent;
            font-size: var(--#{$prefix}h2-fs);
            font-weight: 600;
            color: var(--#{$prefix}primary-text);
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
            background: var(--#{$prefix}icon-logo-bg-color);
            margin-right: 10px;

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

    &.error {
        .select-amount__panel {
            border-color: var(--#{$prefix}danger-color);
            background: var(--#{$prefix}danger-op-01);
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
        display: flex;
        align-items: center;
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
            display: flex;
            align-items: center;

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
