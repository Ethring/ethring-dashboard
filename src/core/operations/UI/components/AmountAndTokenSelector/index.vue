<template>
    <div :class="customClass">
        <div class="amount-and-token-selector--label">
            <span>{{ label }}</span>
        </div>

        <div class="amount-and-token-selector">
            <div class="amount__input-container">
                <a-skeleton-input v-if="false" active class="input-balance input-balance-skeleton" size="" />
                <a-input
                    v-else
                    v-model:value="amount"
                    v-debounce:0.3s="onInputHandler"
                    type="text"
                    data-qa="input-amount"
                    class="amount__input"
                    :class="{ disabled }"
                    :bordered="false"
                    :placeholder="placeholder"
                    :disabled="disabled"
                    @focus="focused = true"
                    @blur="onBlurHandler"
                    @keypress="onKeyPressHandler"
                />

                <div class="amount__in-usd">
                    <Amount type="usd" :value="payTokenPrice || 0" symbol="$" class="amount__in-usd__value" />
                </div>
            </div>
            <div class="token__selector-container" :class="{ 'token__selector-container--disabled': disabled }">
                <div v-if="!hideTokenSelector" class="token__selector" @click="onSelectToken">
                    <div class="token__selector__content">
                        <AssetWithChain
                            class="token__selector__icon"
                            :asset="asset"
                            :chain="(asset?.id && chain) || null"
                            :width="22"
                            :height="22"
                            :divider="1.83"
                        />

                        <div class="token__selector__info">
                            <div class="token__selector__symbol">
                                <span v-if="asset?.symbol">{{ asset?.symbol }}</span>
                                <span v-else class="token__selector__symbol--placeholder">Select token & chain</span>
                            </div>
                            <div v-if="asset?.symbol" class="token__selector__chain">
                                {{ chain?.name }}
                            </div>
                        </div>
                    </div>
                    <div class="token__selector__arrow">
                        <ArrowIcon />
                    </div>
                </div>
                <div
                    class="token__balance"
                    :class="{
                        'token__balance--error': error,
                    }"
                    @click="onSetMax"
                >
                    Balance:
                    <Amount type="currency" :value="asset?.balance || 0" :symbol="null" class="token__balance__value" />
                </div>
            </div>
        </div>
        <!--
    <div class="amount__slider-container">
        <a-slider v-model:value="sliderValue" class="amount__slider" :marks="marks" @change="onChangeSlider">
            <template #mark="{ label, point }">
                <template v-if="point === 100">
                    <strong>max</strong>
                </template>
                <template v-else>{{ label }}</template>
            </template>
        </a-slider>
    </div> -->
    </div>
</template>
<script>
import BigNumber from 'bignumber.js';

import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';

import AssetWithChain from '@/components/app/assets/AssetWithChain.vue';

import ArrowIcon from '@/assets/icons/operations-bag/arrow.svg';
import Amount from '@/components/app/Amount.vue';

import { formatInputNumber } from '@/shared/utils/input';

export default {
    name: 'AmountAndTokenSelector',

    components: {
        Amount,
        AssetWithChain,
        ArrowIcon,
    },

    props: {
        label: {
            type: String,
            default: 'Amount',
        },
        value: {
            type: [String, Number, null],
            required: true,
            default: 0,
        },
        asset: {
            type: [Object, null],
            required: true,
            default: () => ({}),
        },
        chain: {
            type: [Object, null],
            required: true,
            default: () => ({}),
        },
        onSelectToken: {
            type: Function,
        },
        disabled: {
            type: Boolean,
            default: false,
        },

        hideTokenSelector: {
            type: Boolean,
            default: false,
        },
        customClass: {
            type: String,
            default: '',
        },
    },

    emits: ['setAmount'],

    setup(props, { emit }) {
        const store = useStore();

        const isInput = computed({
            get: () => store.getters['tokenOps/isInput'],
            set: (value) => store.dispatch('tokenOps/setIsInput', value),
        });

        const placeholder = ref('0');
        const focused = ref(false);
        const error = ref(false);
        const symbolForReplace = ref(null);

        const amount = ref(props.value);
        const sliderValue = ref(0);

        const marks = {
            0: '0%',
            25: '25%',
            50: '50%',
            75: '75%',
            100: '100%',
        };

        const checkBalanceAllowed = () => {
            if (props.hideMax) return;

            const isBalanceAllowed = +amount.value > +props.asset?.balance;
            error.value = isBalanceAllowed;
        };

        const onFocusHandler = () => {
            placeholder.value = '';
            focused.value = true;
        };

        const onBlurHandler = () => {
            placeholder.value = '0';
            focused.value = false;
        };

        const onInputHandler = () => {
            emit('setAmount', amount.value);
            setTimeout(() => (isInput.value = false), 400);
            // if (amount.value < props.asset.balance)
            // sliderValue.value = BigNumber(amount.value).dividedBy(props.asset.balance).multipliedBy(100).toNumber();
            // else sliderValue.value = 100;
        };

        const onKeyPressHandler = (e) => {
            if (e.code === 'Period' || e.code === 'Comma') symbolForReplace.value = e.key;
        };

        const payTokenPrice = computed(() => (props.asset && BigNumber(amount.value * +props.asset?.price || 0).toFixed()) || 0);

        const onChangeSlider = (value) => {
            if (!value) return (amount.value = 0);
            if (value < 100) amount.value = BigNumber(value).dividedBy(100).multipliedBy(props.asset.balance).toNumber();
        };

        const onSetMax = () => {
            if (props.hideMax) return;
            if (props.disabled) return;

            const toSet = props.asset?.balance || 0;

            if (toSet.length >= 10) amount.value = toSet.toString().slice(0, 10);
            else amount.value = toSet;

            emit('setAmount', amount.value);
        };

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

        return {
            sliderValue,
            marks,

            amount,
            payTokenPrice,

            placeholder,
            focused,
            error,
            symbolForReplace,
            onChangeSlider,

            onSetMax,
            onInputHandler,
            onFocusHandler,
            onBlurHandler,
            onKeyPressHandler,
        };
    },
};
</script>
