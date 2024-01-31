<template>
    <div class="assets__item">
        <template v-if="column === 'name'">
            <div class="network">
                <AssetWithChain :asset="item" :chain="tokenChainIcon" :type="type" />

                <div class="info">
                    <div class="name">
                        <template v-if="ibcTag">
                            {{ ibcTag }}
                            <a-tag v-if="type === 'Asset'" class="ibc-tag" :bordered="false"> IBC </a-tag>
                        </template>
                        <template v-else>
                            {{ item.name || item.symbol }}
                        </template>
                    </div>
                    <div class="type" v-if="item.balanceType">{{ getFormattedName(item.balanceType) }}</div>
                    <div class="unlock" v-if="item.unlockTimestamp">
                        <a-tooltip>
                            <template #title>{{ getFormattedDate(item.unlockTimestamp) }}</template>
                            Unlock: <span class="unlock__value"> {{ getTimeCountdown(item.unlockTimestamp) }} </span>
                        </a-tooltip>
                    </div>
                    <div class="apr" v-if="item.leverageRate"><span>Leverage </span> {{ formatNumber(item.leverageRate, 2) }}x</div>
                    <div class="count" v-if="item.nfts">
                        <a-badge :count="item.nfts.length" class="asset-nfts-count" />
                    </div>
                </div>
            </div>
        </template>

        <template v-if="balanceKeys.includes(column)">
            <Amount :type="item?.symbol ? 'currency' : 'usd'" :value="balance" :symbol="item.symbol" :decimals="3" />
        </template>

        <template v-if="valueKeys.includes(column)">
            <Amount type="usd" :value="balanceUsd" symbol="$" />
        </template>
    </div>
</template>
<script>
import { computed } from 'vue';
import { useStore } from 'vuex';

import AssetWithChain from '@/components/app/assets/AssetWithChain';
import Amount from '../Amount.vue';

import { formatNumber } from '@/shared/utils/numbers';

import BigNumber from 'bignumber.js';

import { getFormattedName, getFormattedDate, getTimeCountdown } from '@/shared/utils/assets';

export default {
    name: 'AssetItem',
    props: {
        type: {
            type: String,
            default: 'asset',
        },
        item: {
            required: true,
        },
        column: {
            default: null,
        },
    },
    components: {
        Amount,
        AssetWithChain,
    },
    setup(props) {
        const BALANCE_KEYS = ['balance', 'totalGroupBalance'];
        const VALUE_KEYS = ['balanceUsd', 'floorPriceUsd'];

        const store = useStore();
        const showBalance = computed(() => store.getters['app/showBalance']);

        const balance = computed(() => {
            if (!showBalance.value) {
                return '****';
            }

            const balanceKey = BALANCE_KEYS.find((key) => props.column === key);

            return BigNumber(props.item[balanceKey] || 0).toString();
        });

        const balanceUsd = computed(() => {
            if (!showBalance.value) {
                return '****';
            }

            const usdKey = VALUE_KEYS.find((key) => props.column === key);

            return BigNumber(props.item[usdKey] || 0).toString();
        });

        const tokenChainIcon = computed(() => {
            if (!props.item?.chainLogo) {
                return null;
            }

            return {
                symbol: props.item.chain,
                logo: props.item.chainLogo,
            };
        });

        const ibcTag = computed(() => {
            if (props.item?.name?.includes('IBC -')) {
                return props.item.name.split('IBC -')[1];
            }

            return null;
        });

        return {
            balance,
            balanceUsd,

            ibcTag,
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
