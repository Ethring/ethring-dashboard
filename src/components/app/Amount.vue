<template>
    <div class="amount-block">
        <template v-if="type === 'usd'">
            <span class="symbol">{{ symbol }}</span>
        </template>

        <div class="value">
            <NumberTooltip :value="value" :decimals="decimals" />
        </div>

        <template v-if="type === 'currency'">
            &nbsp;<span class="symbol">{{ symbol }}</span>
        </template>
    </div>
</template>
<script>
import NumberTooltip from '@/components/ui/NumberTooltip';

export default {
    name: 'Amount',
    props: {
        type: {
            type: String,
            default: 'usd',
        },
        value: {
            required: true,
        },
        symbol: {
            required: true,
            type: String,
            default: '$',
        },
        decimals: {
            required: false,
            type: Number,
            default: 3,
        },
    },
    components: {
        NumberTooltip,
    },
};
</script>
<style lang="scss" scoped>
.amount-block {
    display: inline-flex;
    align-items: flex-end;

    .symbol {
        font-weight: 300;
        color: var(--#{$prefix}secondary-text);
    }

    .value {
        font-weight: 400;
        color: var(--#{$prefix}primary-text);
    }
}
</style>
