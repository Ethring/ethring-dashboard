<template>
    <div class="assets__item">
        <template v-if="column === 'asset'">
            <div class="network">
                <TokenIcon :token="item" />

                <div class="info">
                    <div class="name">{{ item.symbol }}</div>
                </div>
            </div>
        </template>

        <template v-if="column === 'protocol'">
            <div class="network">
                <TokenIcon :token="item.protocol" />

                <div class="info">
                    <div class="name">{{ item.protocol.name }}</div>
                </div>
            </div>
        </template>

        <template v-if="column === 'chains'">
            <div class="chains-row">
                <TokenIcon v-for="chain in chains" :key="chain" :token="chain" width="24" height="24" />
            </div>
        </template>

        <template v-if="balanceKeys.includes(column)">
            <Amount :type="item?.symbol ? 'currency' : 'usd'" :value="balance" :symbol="type === 'NFTS' ? '$' : null" :decimals="3" />
        </template>

        <template v-if="valueKeys.includes(column)">
            <Amount type="usd" :value="balanceUsd" symbol="$" />
        </template>

        <template v-if="column === 'actions'">
            <div>
                <slot name="actions"></slot>
            </div>
        </template>
    </div>
</template>
<script>
import { computed } from 'vue';
import { useStore } from 'vuex';
import BigNumber from 'bignumber.js';

import Amount from '@/components/app/Amount.vue';

import { formatNumber } from '@/shared/utils/numbers';
import { getFormattedName, getFormattedDate, getTimeCountdown } from '@/shared/utils/assets';

export default {
    name: 'AssetRow',
    components: {
        Amount,
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

        const chains = computed(() => {
            const chains = [];
            for (const chain in props.item?.contracts) {
                const logo = store.getters['configs/getChainLogoByNet'](chain);
                chains.push({
                    symbol: chain,
                    logo,
                });
            }
            return chains;
        });

        return {
            balance,
            balanceUsd,

            chains,

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
