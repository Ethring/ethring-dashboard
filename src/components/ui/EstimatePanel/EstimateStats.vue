<template>
    <div class="estimate-stats">
        <p class="title" v-if="title">{{ $t(title) }}:</p>

        <div class="row">
            <Amount
                :value="fromAmount || 0"
                :decimals="fromSymbol === '$' ? 2 : 3"
                :type="fromSymbol === '$' ? 'usd' : 'currency'"
                :symbol="fromSymbol"
            />

            <span class="symbol-between">{{ symbolBetween }}</span>

            <Amount
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
<style lang="scss" scoped>
.estimate-stats {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    justify-content: space-between;
    font-size: var(--#{$prefix}default-fs);
    color: var(--#{$prefix}primary-text);

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
}
</style>
