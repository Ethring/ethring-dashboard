<template>
    <div class="estimate-stats">
        <p class="title" v-if="title">{{ $t(title) }}:</p>
        <p>
            <span class="amount">{{ fromAmount }} </span>
            <span class="symbol">{{ fromSymbol }} </span>
        </p>

        <span class="symbol-between">{{ symbolBetween }}</span>

        <p>
            <span class="amount">{{ toAmount }} </span>
            <span class="symbol">{{ toSymbol }} </span>
        </p>
    </div>
</template>
<script>
export default {
    name: 'EstimateStats',

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
    font-size: var(--#{$prefix}default-fs);
    color: var(--#{$prefix}primary-text);

    .title {
        font-weight: 600;
        color: var(--#{$prefix}accordion-label-color);
        margin-right: 10px;
    }

    .amount {
        font-weight: 600;
        color: var(--#{$prefix}sub-text);
    }

    .symbol {
        font-weight: 300;
    }

    .symbol-between {
        margin: 0 10px;
    }
}
</style>
