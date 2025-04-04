<template>
    <div class="assets__item">
        <template v-if="column === 'name'">
            <div class="network">
                <AssetWithChain :asset="item" :chain="tokenChainIcon" :type="type" />

                <div class="info">
                    <div class="name">
                        {{ type === 'NFTS' ? item.name : item.symbol }}
                        <a-tag v-if="item.testnet" class="ibc-tag" :bordered="false"> Testnet </a-tag>
                        <a-tag v-if="type === 'Asset' && item?.name?.includes('IBC')" class="ibc-tag" :bordered="false"> IBC </a-tag>
                    </div>
                    <div v-if="item.balanceType" class="type">{{ getFormattedName(item.balanceType) }}</div>
                    <div v-if="item.unlockTimestamp" class="unlock">
                        <a-tooltip>
                            <template #title>{{ getFormattedDate(item.unlockTimestamp) }}</template>
                            Unlock: <span class="unlock__value"> {{ getTimeCountdown(item.unlockTimestamp) }} </span>
                        </a-tooltip>
                    </div>
                    <div v-if="item.leverageRate" class="apr"><span>Leverage </span> {{ formatNumber(item.leverageRate, 2) }}x</div>
                    <div v-if="item.nfts" class="count">
                        <a-badge :count="item.nfts" class="asset-nfts-count" />
                    </div>
                </div>
            </div>
        </template>

        <template v-if="balanceKeys.includes(column)">
            <Amount :type="item?.symbol ? 'currency' : 'usd'" :value="balance" :symbol="type === 'NFTS' ? '$' : null" :decimals="3" />
        </template>

        <template v-if="valueKeys.includes(column)">
            <Amount type="usd" :value="balanceUsd" symbol="$" />
        </template>
    </div>
</template>
<script>
import { computed } from 'vue';
import { useStore } from 'vuex';
import BigNumber from 'bignumber.js';

import Amount from '@/components/app/Amount.vue';
import AssetWithChain from '@/components/app/assets/AssetWithChain.vue';

import { formatNumber } from '@/shared/utils/numbers';
import { getFormattedName, getFormattedDate, getTimeCountdown } from '@/shared/utils/assets';

export default {
    name: 'AssetItem',
    components: {
        Amount,
        AssetWithChain,
    },
    props: {
        type: {
            type: String,
            default: 'asset',
        },
        item: {
            type: Object,
            required: true,
        },
        column: {
            type: String,
            default: null,
        },
    },
    setup(props) {
        const BALANCE_KEYS = ['balance', 'totalGroupBalance'];
        const VALUE_KEYS = ['balanceUsd', 'floorPriceUsd'];

        const store = useStore();
        const showBalance = computed(() => store.getters['app/showBalance']);

        const balance = computed(() => {
            if (!showBalance.value) return '****';

            const balanceKey = BALANCE_KEYS.find((key) => props.column === key);

            return BigNumber(props.item[balanceKey] || 0).toString();
        });

        const balanceUsd = computed(() => {
            if (!showBalance.value) return '****';

            const usdKey = VALUE_KEYS.find((key) => props.column === key);

            return BigNumber(props.item[usdKey] || 0).toString();
        });

        const tokenChainIcon = computed(() => {
            return {
                symbol: props.item?.chain,
                logo: props.item?.chainLogo || null,
            };
        });

        return {
            balance,
            balanceUsd,

            tokenChainIcon,

            getFormattedName,
            getFormattedDate,
            getTimeCountdown,
            formatNumber,

            balanceKeys: BALANCE_KEYS,
            valueKeys: VALUE_KEYS,
        };
    },
};
</script>
