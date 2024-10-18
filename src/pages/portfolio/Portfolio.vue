<template>
    <div class="portfolio" data-qa="portfolio">
        <template v-if="!walletAccount">
            <ConnectWalletAdapter />
        </template>
        <template v-else>
            <WalletInfoLarge />

            <div class="portfolio-value">
                <div>
                    <span class="title">{{ $t('portfolio.value') }}</span>
                    <Amount type="usd" :value="portfolioValue" symbol="$" />
                </div>
            </div>

            <div class="portfolio-block">
                <a-table
                    class="portfolio-table"
                    :columns="COLUMNS"
                    :data-source="allPools"
                    :pagination="false"
                    :bordered="false"
                    :loading="loading"
                    :scroll="{ x: 800 }"
                    :row-key="rowKey"
                >
                    <template #bodyCell="{ column, record }">
                        <template v-if="column.dataIndex === 'name'">
                            <span class="name">{{ record.name }} </span>
                        </template>
                        <template v-if="column.dataIndex === 'balance'">
                            <Amount type="currency" :value="record.balance" :symbol="record.symbol" />
                        </template>
                        <template v-if="column.dataIndex === 'balanceUsd'">
                            <Amount type="usd" :value="record.balanceUsd" symbol="$" />
                        </template>
                        <template v-if="column.dataIndex === 'rewards'">
                            <span class="rewards">{{ +record.metrics?.apy > 0 ? record.metrics?.apy + '%' : 'N/A' }} </span>
                        </template>
                        <template v-if="column.dataIndex === 'network'">
                            <a-row>
                                <TokenIcon :token="{ symbol: record.net, logo: record.chainLogo }" width="20" height="20" />
                                <span class="network">{{ record.network }} </span>
                            </a-row>
                        </template>
                        <template v-if="column.dataIndex === 'withdraw'">
                            <UiButton title="withdraw" @click="() => handleWithdraw(record)" />
                        </template>
                    </template>
                </a-table>
            </div>
        </template>
    </div>
</template>

<script>
import { computed, watch, ref } from 'vue';

import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';
import usePoolsList from '@/compositions/usePoolList';

import ConnectWalletAdapter from '@/components/app/ConnectWalletAdapter.vue';
import WalletInfoLarge from '@/components/app/WalletInfoLarge.vue';
import Amount from '@/components/app/Amount.vue';
import UiButton from '@/components/ui/Button.vue';
import TokenIcon from '@/components/ui/Tokens/TokenIcon.vue';

export default {
    name: 'Portfolio',
    components: {
        WalletInfoLarge,
        ConnectWalletAdapter,
        Amount,
        UiButton,
        TokenIcon,
    },
    setup() {
        const router = useRouter();
        const store = useStore();

        const { walletAccount, connectedWallet, currentChainInfo } = useAdapter();

        const pools = usePoolsList();
        const allPools = computed(() => Object.values(pools.value).flat(1));

        const portfolioValue = computed(() => allPools.value.reduce((sum, item) => sum + item.balanceUsd, 0));

        const COLUMNS = [
            {
                title: 'Name',
                dataIndex: 'name',
                key: 'name',
                width: '30%',
                align: 'left',
            },
            {
                title: 'Value',
                dataIndex: 'balanceUsd',
                key: 'balanceUsd',
                width: '10%',
                align: 'left',
                defaultSortOrder: 'descend',
                sorter: (a, b) => a.balanceUsd - b.balanceUsd,
            },
            {
                title: 'Balance',
                dataIndex: 'balance',
                key: 'balance',
                width: '20%',
                align: 'left',
                defaultSortOrder: 'descend',
                sorter: (a, b) => a.balance - b.balance,
            },
            {
                title: 'Network',
                dataIndex: 'network',
                key: 'network',
                width: '15%',
                align: 'left',
            },
            {
                title: 'Rewards',
                dataIndex: 'rewards',
                key: 'rewards',
                width: '15%',
                align: 'left',
            },
            {
                title: '',
                dataIndex: 'withdraw',
                key: 'withdraw',
                width: '10%',
                align: 'left',
            },
        ];

        const handleWithdraw = (pool) => {
            store.dispatch('tokenOps/setSelectedPool', pool);
            router.push('/withdraw/SC-remove-liquidity-pool');
        };

        return {
            COLUMNS,
            allPools,
            portfolioValue,
            walletAccount,

            handleWithdraw,
        };
    },
};
</script>
