<template>
    <div class="quote-preview">
        <div v-if="!error && !isLoading" class="quote-preview__header">
            <div>Summary</div>

            <div class="quote-preview__header__actions">
                <div class="quote-preview__header__slippage">
                    <div>Slippage</div>
                    <div>{{ slippage }}%</div>
                </div>

                <div class="quote-preview__header__settings" @click="openSettingsModal">
                    <SettingsIcon />
                </div>
            </div>
        </div>

        <div v-if="!error && !isLoading" class="quote-preview__summary">
            <div class="quote-preview__summary__item">
                <div>Route</div>
                <div>
                    <QuoteServiceIcon v-if="!isQuoteLoading && service" v-bind="service" :show-title="true" />
                    <template v-else-if="isQuoteLoading">
                        <a-space>
                            <a-skeleton-avatar :size="24" />
                            <a-skeleton-input active size="small" class="skeleton" />
                        </a-space>
                    </template>
                </div>
            </div>

            <div class="quote-preview__summary__item">
                <div>Rate</div>
                <div>
                    <template v-if="isQuoteLoading">
                        <a-skeleton-input active size="small" class="skeleton" />
                    </template>
                    <template v-else-if="!isQuoteLoading && fees.RATE?.toAmount">
                        <Amount :value="fees.RATE.fromAmount" :decimals="2" :symbol="fees.RATE.fromSymbol" type="currency" />
                        {{ fees.RATE.symbolBetween }}
                        <Amount :value="fees.RATE.toAmount" :decimals="2" :symbol="fees.RATE.toSymbol" type="currency" />
                    </template>
                </div>
            </div>

            <div class="quote-preview__summary__item">
                <div>Estimate Fees</div>
                <div>
                    <template v-if="isQuoteLoading">
                        <a-skeleton-input active size="small" class="skeleton" />
                    </template>
                    <template v-else-if="!isQuoteLoading && fees.BASE">
                        <Amount v-if="fees.BASE > 0" :value="fees.BASE" :decimals="2" symbol="$" type="usd" />
                    </template>
                    <template v-else> 0 </template>
                </div>
            </div>

            <div class="quote-preview__summary__item quote-preview__summary__item--receive">
                <div>Receive</div>
                <div>
                    <template v-if="isQuoteLoading">
                        <a-skeleton-input active size="small" class="skeleton" />
                    </template>

                    <template v-else-if="!isQuoteLoading && fees.RATE && quote?.toAmount">
                        <div class="quote-preview__receive">
                            <Amount
                                v-if="isShowCurrency"
                                :value="quote.toAmount"
                                :decimals="2"
                                :symbol="fees.RATE.toSymbol"
                                type="currency"
                            />
                            <Amount v-else :value="usdAmount(quote.toAmount)" :decimals="2" symbol="$" type="usd" />
                            <div class="quote-preview__receive_switcher" @click="isShowCurrency = !isShowCurrency">
                                <ArrowUpDown />
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </div>

        <div v-if="error && !isLoading" class="quote-preview__footer">
            <a-tooltip class="error" :title="!error ? $t('tokenOperations.noAvailableRoute') : error">
                <template v-if="error.length <= MAX_LENGTH">
                    <a-row align="middle" class="route-error">
                        {{ error }}
                    </a-row>
                </template>
                <template v-else>
                    <a-tooltip placement="topLeft">
                        <template #title>
                            <a-row align="middle" class="route-error">
                                {{ error }}
                            </a-row>
                        </template>
                        <a-row align="middle" class="route-error">
                            {{ error }}
                        </a-row>
                    </a-tooltip>
                </template>
            </a-tooltip>
        </div>
    </div>
</template>
<script>
import { computed, ref, watch } from 'vue';
import { useStore } from 'vuex';

import Amount from '@/components/app/Amount.vue';
import QuoteServiceIcon from './QuoteServiceIcon.vue';

import SettingsIcon from '@/assets/icons/operations-bag/settings.svg';
import ArrowUpDown from '@/assets/icons/operations-bag/arrowUpDown.svg';

import { calculateMinAmount } from '@/shared/calculations/calculate-fee';
import BigNumber from 'bignumber.js';

export default {
    name: 'QuotePreview',

    components: {
        SettingsIcon,
        ArrowUpDown,
        QuoteServiceIcon,
    },
    props: {
        isLoading: {
            type: Boolean,
            default: false,
        },

        quote: {
            type: Object,
            default: () => ({}),
        },

        asset: {
            type: Object,
            default: () => ({}),
        },

        dstAmount: {
            type: [String, Number],
            default: 0,
        },

        fees: {
            type: Object,
            default: () => ({}),
        },
        error: {
            type: String,
            default: '',
        },
    },

    setup(props) {
        const isShowCurrency = ref(false);

        const store = useStore();

        const slippage = computed(() => store.getters['tokenOps/slippage']);
        const isQuoteLoading = computed(() => store.getters['bridgeDexAPI/getLoaderState']('quote'));

        const service = computed(() => (props.quote ? store.getters['bridgeDexAPI/getServiceById'](props.quote?.serviceId) : ''));

        const minOutAmount = (amount) => calculateMinAmount(amount, slippage.value);

        const usdAmount = (amount) => BigNumber(amount).multipliedBy(props.asset.price).toString();

        const openSettingsModal = () => store.dispatch('app/toggleModal', 'settingsModal');

        watch(
            () => props.asset,
            () => {
                console.log('asset changed', props.asset);
            },
        );

        return {
            isShowCurrency,

            slippage,
            isQuoteLoading,
            service,

            MAX_LENGTH: 55,

            minOutAmount,
            usdAmount,

            openSettingsModal,
        };
    },
};
</script>
