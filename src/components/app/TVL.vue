<template>
    <div class="tvl">
        <a-tooltip>
            <template #title> TVL: {{ value }} </template>
            <div class="tvl__value">
                {{ tvlAmount }}
            </div>
        </a-tooltip>
    </div>
</template>

<script>
import { computed } from 'vue';

export default {
    name: 'TVL',
    props: {
        value: {
            type: Number,
            required: true,
        },
    },
    setup(props) {
        const formatAmount = (amount) => {
            const formatter = new Intl.NumberFormat('en-US', {
                notation: 'compact',
                compactDisplay: 'short',
                maximumFractionDigits: 1,
            });
            return formatter.format(amount);
        };

        const tvlAmount = computed(() => formatAmount(props.value));

        return {
            tvlAmount,
            formatAmount,
        };
    },
};
</script>
