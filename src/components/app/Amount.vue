<template>
    <div class="amount-block" :class="{ [type]: type }">
        <template v-if="showBalance">
            <template v-if="type === 'usd'">
                <span class="symbol">{{ symbol }}</span>
            </template>

            <div class="value">
                <a-tooltip placement="topRight">
                    <template #title v-if="isInteger">{{ tooltipValue }}</template>
                    {{ displayValue }}
                </a-tooltip>
            </div>

            <template v-if="type === 'currency'">
                &nbsp;<span class="symbol">{{ symbol }}</span>
            </template>

            <template v-if="!['currency', 'usd'].includes(type)">
                <span class="symbol">{{ symbol }}</span>
            </template>
        </template>
        <template v-else>
            <Censorship :distance="`${displayValue}${symbol}`?.length" />
        </template>
    </div>
</template>
<script>
import { useStore } from 'vuex';
import { computed } from 'vue';

import Censorship from './Censorship.vue';

import { formatNumber } from '@/shared/utils/numbers';

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
            default: '',
        },
        decimals: {
            required: false,
            type: [String, Number],
            default: 3,
        },
    },
    components: {
        Censorship,
    },
    setup(props) {
        const store = useStore();

        const showBalance = computed(() => store.getters['app/showBalance']);

        const isInteger = computed(() => !Number.isInteger(+props.value));

        const displayValue = computed(() => {
            if (props.value == '0') {
                return '0';
            }

            if (Number.isNaN(+props.value) && props.value !== '0') {
                return '~0';
            }

            return formatNumber(props.value, props.decimals);
        });

        const tooltipValue = computed(() => {
            if (props.type === 'usd') {
                return `${props.symbol} ${props.value}`;
            }

            return `${props.value} ${props.symbol}`;
        });

        return {
            showBalance,
            formatNumber,

            displayValue,
            tooltipValue,

            isInteger,
        };
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

.wallet-info .amount-block .value {
    font-weight: 700;
}

.preview-custom-fee .amount-block .value {
    color: var(--#{$prefix}warning);
    font-size: var(--#{$prefix}small-lg-fs);
    font-weight: 600;
}

.stat-container .amount-block.usd {
    font-size: var(--#{$prefix}small-sm-fs);

    .symbol,
    .value {
        color: var(--#{$prefix}mute-text);
    }
}
</style>
