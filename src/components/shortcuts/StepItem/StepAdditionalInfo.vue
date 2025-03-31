<template>
    <a-space size="small" direction="vertical" class="step-additional-info">
        <a-space v-if="percentageInfo?.from && percentageInfo?.percentage" size="small" direction="horizontal">
            <Amount :value="percentageInfo.to.amount || 0" :symbol="percentageInfo.to.symbol" type="currency" />
            <span>=</span>
            <Amount :value="percentageInfo.percentage.amount" symbol="%" type="currency" />
            <span>of</span>
            <Amount :value="percentageInfo.from.amount" :symbol="percentageInfo.from.symbol" type="currency" />
            <span>from</span>
            <a-tag :bordered="false" color="success"> Step #{{ amountInfo.stepIndex }} </a-tag>
        </a-space>
    </a-space>
</template>
<script lang="ts">
import { IAsset } from '@/shared/models/fields/module-fields';
import Amount from '@/components/app/Amount.vue';

export default {
    name: 'StepAdditionalInfo',
    components: {
        Amount,
    },

    props: {
        amountInfo: {
            type: Object,
            required: true,
            default: () => ({
                from: {},
                to: {},
                stepIndex: 0,
            }),
        },
        percentageInfo: {
            type: Object,
            required: true,
            default: () => ({
                from: {},
                to: {},
                percentage: {},
            }),
        },
    },
};
</script>
