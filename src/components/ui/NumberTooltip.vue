<template>
    <a-tooltip placement="topRight">
        <template #title v-if="!Number.isInteger(+value)">{{ value }}</template>
        {{ formatNumber(value, decimals) }}
    </a-tooltip>
</template>

<script>
import { formatNumber } from '@/helpers/prettyNumber';

export default {
    name: 'NumberTooltip',
    props: {
        value: {
            default: null,
        },
        decimals: {
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
