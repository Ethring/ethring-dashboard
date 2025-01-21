<template>
    <template v-if="column === 'asset'">
        <div class="asset__item--network">
            <TokenIcon :token="item" :width="20" :height="20" />

            <div class="asset__item--info">
                <div class="name">{{ item.symbol }}</div>
            </div>
        </div>
    </template>

    <template v-if="column === 'protocol'">
        <div class="asset__item--network asset__item--protocol">
            <TokenIcon :token="item.protocol" :width="20" :height="20" />

            <div class="asset__item--info">
                <div class="name">{{ item.protocol.name }}</div>
            </div>
        </div>
    </template>

    <template v-if="column === 'chain'">
        <div class="asset__item--network">
            <TokenIcon :key="chainInfo" :token="chainInfo" width="20" height="20" />
        </div>
    </template>
    <template v-if="column === 'tvl'">
        <Amount type="usd" :value="200000000" symbol="$" class="asset__item--amount asset__item--tvl" />
    </template>
    <template v-if="column === 'apy'">
        <Amount type="currency" :value="2.5" symbol="%" class="asset__item--amount asset__item--apy" />
    </template>
    <template v-if="column === 'rewards'">
        <RewardsIcons />
    </template>

    <template v-if="balanceKeys.includes(column)">
        <Amount :type="item?.symbol ? 'currency' : 'usd'" :value="balance" :decimals="3" class="asset__item--amount" />
    </template>

    <template v-if="valueKeys.includes(column)">
        <Amount type="usd" :value="balanceUsd" symbol="$" class="asset__item--amount" />
    </template>

    <template v-if="column === 'actions'">
        <div>
            <slot name="actions"></slot>
        </div>
    </template>
</template>
<script>
import { computed } from 'vue';
import { useStore } from 'vuex';
import BigNumber from 'bignumber.js';

import Amount from '@/components/app/Amount.vue';

import { formatNumber } from '@/shared/utils/numbers';
import { getFormattedName, getFormattedDate, getTimeCountdown } from '@/shared/utils/assets';

import RewardsIcons from '@/assets/icons/dashboard/rewards.svg';

export default {
    name: 'AssetRow',
    components: {
        Amount,
        RewardsIcons,
    },
    props: {
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

        const chainInfo = computed(() => {
            const logo = store.getters['configs/getChainLogoByNet'](props.item.chain);
            return {
                symbol: props.item.chain,
                logo,
            };
        });

        return {
            balance,
            balanceUsd,

            chainInfo,

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
