<template>
    <a-tooltip placement="topRight" v-if="!Number.isInteger(+value)">
        <template #title>{{ value }}</template>
        {{ formatNumber(+value, decimals) }}
    </a-tooltip>
    <template v-else>
        {{ formatNumber(+value, decimals) }}
    </template>
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
