<template>
    <template v-if="column === 'asset'">
        <div class="asset__item--network">
            <AssetWithChain :asset="item" :chain="item.chainInfo" :width="30" :height="30" :divider="1.875" />

            <div class="asset__item--group asset__item--asset">
                <div class="name">{{ item.symbol }}</div>

                <div class="asset__item--network asset__item--protocol">
                    <TokenIcon :token="item.protocol" :width="16" :height="16" />

                    <div class="asset__item--info">
                        <div class="name">{{ item?.protocol?.name }}</div>
                    </div>
                </div>
            </div>
        </div>
    </template>

    <template v-if="column === 'protocol'">
        <div class="asset__item--network asset__item--protocol">
            <TokenIcon :token="item.protocol" :width="20" :height="20" />

            <div class="asset__item--info">
                <div class="name">{{ item?.protocol?.name }}</div>
            </div>
        </div>
    </template>
    <template v-if="column === 'category'">
        <template v-if="item?.category?.name.length < 8">
            <div class="asset__item--yield">
                <div class="name">{{ item?.category?.name }}</div>
            </div>
        </template>
        <a-tooltip v-else-if="item?.category?.name && item?.category?.name.length >= 8" placement="top">
            <template #title>
                {{ item?.category?.name }}
            </template>
            <div v-if="item?.category?.name" class="asset__item--yield">
                <div class="name">{{ item?.category?.name }}</div>
            </div>
        </a-tooltip>
    </template>

    <template v-if="column === 'chain'">
        <div class="asset__item--network asset__item--chain">
            <TokenIcon :key="item?.chainInfo?.net" :token="item?.chainInfo" width="20" height="20" />

            <div class="asset__item--info">
                <div class="name">{{ item?.chainInfo?.name }}</div>
            </div>
        </div>
    </template>
    <template v-if="column === 'tvl'">
        <TVL v-if="item.tvl" :value="item.tvl" />
    </template>
    <template v-if="column === 'apy24h'">
        <Amount
            v-if="
                item.apy?.length > 0 &&
                item.apy.find((apy) => apy.apyType === 'base') &&
                item.apy.find((apy) => apy.apyType === 'base').apy > 0
            "
            type="currency"
            :value="item.apy.find((apy) => apy.apyType === 'base').apy"
            symbol="%"
            class="asset__item--amount asset__item--apy"
        />
    </template>
    <template v-if="column === 'apy7d'">
        <Amount
            v-if="
                item.apy?.length > 0 && item.apy.find((apy) => apy.apyType === '7d') && item.apy.find((apy) => apy.apyType === '7d').apy > 0
            "
            type="currency"
            :value="item.apy.find((apy) => apy.apyType === '7d').apy"
            symbol="%"
            class="asset__item--amount asset__item--apy"
        />
    </template>
    <template v-if="column === 'apy30d'">
        <Amount
            v-if="
                item.apy?.length > 0 &&
                item.apy.find((apy) => apy.apyType === '30d') &&
                item.apy.find((apy) => apy.apyType === '30d').apy > 0
            "
            type="currency"
            :value="item.apy.find((apy) => apy.apyType === '30d').apy"
            symbol="%"
            class="asset__item--amount asset__item--apy"
        />
    </template>
    <template v-if="column === 'rewards'">
        <div v-if="item.rewards" class="asset__item--rewards">
            <a-tooltip v-for="record in item.rewards" :key="record.id" placement="topLeft">
                <template #title> {{ `${record.pointCount} - ${record.reward.name}` }} </template>
                <a :href="record.reward.url" target="_blank" class="asset__item--reward" :title="record.reward.name">
                    <TokenIcon :token="record.reward" :width="16" :height="16" />
                </a>
            </a-tooltip>
        </div>
    </template>

    <template v-if="balanceKeys.includes(column)">
        <Amount :type="item?.symbol ? 'currency' : 'usd'" :value="balance" :decimals="3" class="asset__item--amount asset__item--balance" />
    </template>

    <template v-if="valueKeys.includes(column)">
        <Amount type="usd" :value="balanceUsd" symbol="$" class="asset__item--amount asset__item--value" />
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
import TVL from '@/components/app/TVL.vue';

import { formatNumber } from '@/shared/utils/numbers';
import { getFormattedName, getFormattedDate, getTimeCountdown } from '@/shared/utils/assets';

import AssetWithChain from '@/components/app/assets/AssetWithChain.vue';
import TokenIcon from '../Tokens/TokenIcon.vue';

export default {
    name: 'AssetRow',
    components: {
        Amount,
        TVL,
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
