<template>
    <a-tooltip placement="topRight">
        <template v-if="!Number.isInteger(+value)" #title>{{ Number.isNaN(+value) ? '~0' : +value }}</template>
        {{ formatNumber(value, decimals) }}
    </a-tooltip>
</template>

<script>
import { formatNumber } from '@/shared/utils/numbers';

export default {
    name: 'NumberTooltip',
    props: {
        value: {
            type: [String, Number],
            default: null,
        },
        decimals: {
            type: Number,
            default: 2,
        },
    },
    setup() {
        return {
            formatNumber,
        };
    },
};
</script>
