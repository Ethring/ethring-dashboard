<template>
    <div class="quote-preview">
        <div class="quote-preview__header">
            <div>Summary</div>

            <div class="quote-preview__header__actions">
                <div class="quote-preview__header__slippage">
                    <div>Slippage</div>
                    <div>{{ slippage }}%</div>
                </div>

                <div class="quote-preview__header__settings">
                    <SettingsIcon />
                </div>
            </div>
        </div>
        <div class="quote-preview__summary">
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
                    <template v-else> 0 </template>
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
            <div class="quote-preview__summary__item">
                <div>Receive</div>
                <div>
                    <template v-if="isQuoteLoading">
                        <a-skeleton-input active size="small" class="skeleton" />
                    </template>

                    <template v-else-if="!isQuoteLoading && fees.RATE && quote?.toAmount">
                        <Amount :value="minOutAmount(quote.toAmount)" :decimals="2" :symbol="fees.RATE.toSymbol" type="currency" />
                    </template>
                    <template v-else> 0 </template>
                </div>
            </div>
            <div v-if="service" class="quote-preview__summary__item">
                <div>Route</div>
                <div>
                    <ServiceIcon v-bind="service" :show-title="true" />
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import { computed } from 'vue';
import { useStore } from 'vuex';

import Amount from '@/components/app/Amount.vue';
import ServiceIcon from '../EstimatePanel/ServiceIcon.vue';

import SettingsIcon from '@/assets/icons/operations-bag/settings.svg';

import { calculateMinAmount } from '@/shared/calculations/calculate-fee';

export default {
    name: 'QuotePreview',

    components: {
        SettingsIcon,
        ServiceIcon,
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

        dstAmount: {
            type: [String, Number],
            default: 0,
        },

        fees: {
            type: Object,
            default: () => ({}),
        },
    },

    setup(props) {
        const store = useStore();

        const slippage = computed(() => store.getters['tokenOps/slippage']);
        const isQuoteLoading = computed(() => store.getters['bridgeDexAPI/getLoaderState']('quote'));

        const service = computed(() => (props.quote ? store.getters['bridgeDexAPI/getServiceById'](props.quote?.serviceId) : ''));

        const minOutAmount = (amount) => calculateMinAmount(amount, slippage.value);

        return {
            slippage,
            isQuoteLoading,
            service,

            minOutAmount,
        };
    },
};
</script>
