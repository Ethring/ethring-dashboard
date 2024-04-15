<template>
    <div class="estimate-stats">
        <p class="title" v-if="title">{{ title }}</p>

        <div class="row">
            <Amount
                v-if="fromAmount"
                :value="fromAmount || 0"
                :decimals="fromSymbol === '$' ? 2 : 3"
                :type="fromSymbol === '$' ? 'usd' : 'currency'"
                :symbol="fromSymbol"
            />

            <span class="symbol-between" v-if="toAmount">{{ symbolBetween }}</span>

            <Amount
                v-if="toAmount"
                :value="toAmount || 0"
                :decimals="toSymbol === '$' ? 2 : 3"
                :type="toSymbol === '$' ? 'usd' : 'currency'"
                :symbol="toSymbol"
            />
        </div>
    </div>
</template>
<script>
import Amount from '@/components/app/Amount';

export default {
    name: 'EstimateStats',
    components: { Amount },
    props: {
        title: {
            type: String,
            default: null,
        },

        symbolBetween: {
            type: String,
            default: '',
        },

        fromAmount: {
            type: [String, Number],
            default: '',
        },
        toAmount: {
            type: [String, Number],
            default: '',
        },

        fromSymbol: {
            type: String,
            default: '',
        },

        toSymbol: {
            type: String,
            default: '',
        },
    },
};
</script>
<style lang="scss">
.estimate-stats {
    @include pageFlexRow;
    flex-wrap: wrap;
    justify-content: space-between;

    font-size: var(--#{$prefix}default-fs);
    color: var(--#{$prefix}primary-text);

    line-height: 24px;

    .title {
        font-weight: 400;
        color: var(--#{$prefix}accordion-label-color);
    }

    .amount-block.currency {
        .value,
        .symbol {
            color: var(--#{$prefix}base-text) !important;
            font-weight: 400;
        }
    }

    .symbol-between {
        margin: 0 4px;
    }
}
</style>
