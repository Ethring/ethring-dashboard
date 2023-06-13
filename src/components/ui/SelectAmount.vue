<template>
    <div :class="{ active, focused, error }" class="select-amount" @click="setActive">
        <div class="select-amount__panel">
            <div class="label">{{ label }}</div>
            <div class="info-wrap">
                <div class="info" @click="clickToken">
                    <div class="network">
                        <TokenIcon width="24" height="24" :token="selectedToken" dark />
                    </div>
                    <div class="token">{{ selectedToken?.code }}</div>
                    <arrowSvg class="arrow" />
                </div>
                <input
                    v-model="amount"
                    :placeholder="placeholder"
                    :disabled="disabled"
                    @focus="onFocus"
                    v-debounce:300ms="onInput"
                    @blur="onBlur"
                    @click.stop="() => {}"
                    class="input-balance"
                />
            </div>
            <div class="balance" @click.stop="setMax">
                <p>
                    {{ $t('simpleSend.balance') }}:
                    <span>
                        {{ BigNumber(selectedToken?.balance?.amount || selectedToken?.balance?.mainBalance || 0).toFixed() }}
                    </span>
                    {{ selectedToken?.code }}
                </p>
                <div><span>$</span>{{ prettyNumber(BigNumber(amount * selectedToken?.price?.USD).toFixed()) }}</div>
            </div>
        </div>
        <div v-if="active" class="select-amount__items" v-click-away="clickAway">
            <div
                v-for="(item, ndx) in items"
                :key="ndx"
                :class="{ active: item.name === selectedToken?.name }"
                class="select-amount__items-item"
                @click="setToken(item)"
            >
                <div class="info">
                    <div class="name">{{ item.name }}</div>
                </div>
                <div class="amount">
                    {{
                        prettyNumber(
                            item.name === selectedToken?.name
                                ? BigNumber(selectedToken?.balance?.mainBalance || 0).toFixed()
                                : BigNumber(item.balance?.amount || 0).toFixed()
                        )
                    }}
                    <span>{{ item.code }}</span>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import arrowSvg from '@/assets/icons/dashboard/arrowdowndropdown.svg';

import TokenIcon from '@/components/ui/TokenIcon';

import { prettyNumber } from '@/helpers/prettyNumber';
import { ref, watch, onMounted } from 'vue';
import BigNumber from 'bignumber.js';

export default {
    name: 'SelectAmount',
    props: {
        value: {
            required: true,
        },
        items: {
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
    },
    components: {
        arrowSvg,
        TokenIcon,
    },
    setup(props, { emit }) {
        const active = ref(false);
        const focused = ref(false);
        const amount = ref('');
        const selectedToken = ref(props.value);
        const placeholder = ref('0');

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
                let balance = selectedToken.value?.balance?.amount || selectedToken.value?.balance?.mainBalance;
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
            amount.value = '';
            selectedToken.value = item;

            emit('setAmount', amount.value);
            emit('setToken', selectedToken.value);
        };
        const clickToken = () => {
            emit('clickToken');
        };
        onMounted(() => {
            setToken(selectedToken.value);
        });

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
        background: $colorGray;
        border-radius: 16px;
        height: 160px;
        padding: 17px 32px;
        box-sizing: border-box;
        border: 2px solid transparent;
        cursor: pointer;

        .label {
            color: #486060;
            font-family: 'Poppins_SemiBold';
        }

        .balance {
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: #486060;
            font-family: 'Poppins_Regular';
            font-weight: 400;
            font-size: 14px;
            line-height: 21px;
            span {
                font-family: 'Poppins_SemiBold';
                font-weight: 600;
                font-size: 16px;
                color: $colorBaseGreen;
            }
            div {
                font-family: 'Poppins_SemiBold';
                color: #486060;
                font-size: 14px;
                line-height: 21px;
                span {
                    font-family: 'Poppins_Regular';
                    color: #486060;
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
            font-size: 28px;
            font-family: 'Poppins_SemiBold';
            color: $colorBlack;
            margin-right: 10px;
        }

        .input-balance {
            width: 75%;
            text-align: right;
            min-width: 100px;
            border: none;
            outline: none;
            background: transparent;
            font-size: 28px;
            font-family: 'Poppins_SemiBold';
        }

        .max {
            margin-left: 10px;
            font-size: 28px;
            color: $colorBlack;
            font-family: 'Poppins_SemiBold';
        }

        .network {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 40px;
            min-width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #3fdfae;
            margin-right: 10px;

            svg {
                fill: $colorBlack;
            }
        }

        .name {
            font-size: 28px;
            font-family: 'Poppins_SemiBold';
            color: #73b1b1;
            user-select: none;
        }

        svg.arrow {
            cursor: pointer;
            fill: #73b1b1;
            transform: rotate(0);
            @include animateEasy;
        }
    }

    &.focused {
        .select-amount__panel {
            border: 2px solid $colorBaseGreen;
            background: $colorWhite;
        }
    }

    &.active {
        .select-amount__panel {
            border: 2px solid $colorBaseGreen;
            background: $colorWhite;

            svg.arrow {
                transform: rotate(180deg);
            }
        }
    }

    &.error {
        .select-amount__panel {
            border-color: $colorRed;
            background: $colorLightOrange;
        }
    }

    &__items {
        z-index: 100;
        background: #fff;
        position: absolute;
        left: 0;
        top: 160px;
        width: 100%;
        min-height: 40px;
        border-radius: 16px;
        border: 2px solid $colorBaseGreen;
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
        border-bottom: 1px dashed #73b1b1;
        cursor: pointer;
        @include animateEasy;

        &.active {
            .info {
                .name {
                    color: $colorBlack;
                    font-family: 'Poppins_SemiBold';
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
                font-size: 16px;
                color: #486060;
                font-family: 'Poppins_Regular';
            }
        }

        &:hover {
            .info {
                .name {
                    color: $colorBaseGreen;
                }
            }
        }

        .amount {
            color: $colorBlack;
            font-family: 'Poppins_SemiBold';

            span {
                color: $colorBlack;
                font-family: 'Poppins_Regular';
            }
        }
    }
}

body.dark {
    .select-amount {
        &__panel {
            background: $colorDarkPanel;

            .label,
            .balance {
                color: $colorLightGreen;

                div {
                    color: $colorLightGreen;
                }
            }

            svg.arrow {
                fill: #486060;
            }

            .input-balance {
                color: $colorWhite;
            }

            .info {
                .network {
                    background: #0c0d18;
                }

                .name {
                    color: $colorWhite;
                }
            }

            .token {
                color: $colorBrightGreen;
            }

            .max {
                color: #97ffd0;
            }
        }

        &.focused {
            .select-amount__panel {
                border: 2px solid $colorBrightGreen;
                background: $colorDarkPanel;
            }
        }

        &.active {
            .select-amount__panel {
                border: 2px solid $colorBrightGreen;
                background: $colorDarkPanel;
            }
        }

        &.error {
            .select-amount__panel {
                border-color: $colorRed;
                background: $colorDarkPanel;
            }
        }

        .select-amount__items {
            background: #0c0d18;
            border-color: $colorBrightGreen;
        }

        .select-amount__items-item {
            border-color: #e8e9c933;

            &:last-child {
                border-color: transparent;
            }

            .info {
                .name {
                    color: $colorPl;
                }
            }

            &:hover {
                .info {
                    .name {
                        color: #97ffd0;
                    }
                }
            }

            .amount {
                color: $colorBrightGreen;

                span {
                    color: $colorPl;
                }
            }
        }

        .select-amount__items-item.active {
            .info {
                .balance {
                    color: $colorWhite;
                }
            }
        }
    }
}
</style>
