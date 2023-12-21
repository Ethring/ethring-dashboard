<template>
    <div class="estimate-stats">
        <p class="title" v-if="title">{{ $t(title) }}:</p>

        <div class="row">
            <p v-if="fromAmount" class="amount">
                <NumberTooltip :value="fromAmount" :decimals="fromSymbol === '$' ? 2 : 3" />
                <span class="symbol">{{ fromSymbol }} </span>
            </p>

            <span class="symbol-between">{{ symbolBetween }}</span>

            <p class="amount">
                <NumberTooltip :value="toAmount" :decimals="toSymbol === '$' ? 2 : 3" />
                <span class="symbol" :class="toSymbol === '$' && 'usd-symbol'">{{ toSymbol }} </span>
            </p>
        </div>
    </div>
</template>
<script>
import NumberTooltip from '@/components/ui/NumberTooltip';

export default {
    name: 'EstimateStats',
    components: { NumberTooltip },
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
<style lang="scss" scoped>
.estimate-stats {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    justify-content: space-between;
    font-size: var(--#{$prefix}default-fs);
    color: var(--#{$prefix}primary-text);
    margin: 2px 0 0;

    .title {
        font-weight: 400;
        color: var(--#{$prefix}accordion-label-color);
        margin-right: 10px;
    }

    .amount {
        font-weight: 700;
        color: var(--#{$prefix}primary-text);
    }

    .usd-symbol,
    .symbol {
        font-weight: 300;
        color: var(--#{$prefix}primary-text);
        margin-left: 3px;
    }

    .usd-symbol {
        margin-left: 0px;
    }
    .symbol-between {
        margin: 0 4px;
    }

    .row {
        @include pageFlexRow;
    }
}
</style>
