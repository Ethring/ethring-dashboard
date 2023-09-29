<template>
    <div class="tokens" :class="{ empty: isEmpty }">
        <template v-if="allTokens.length > 0">
            <div class="tokens__group">
                <AssetItemHeader
                    v-if="allTokens.length"
                    title="Tokens"
                    :value="getAssetsShare(tokensTotalBalance)"
                    :totalBalance="tokensTotalBalance"
                />
                <AssetItemSubHeader type="Asset" />

                <AssetItem v-for="(listItem, n) in sortByKey(allTokens, 'balanceUsd')" :key="n" :item="listItem" />
            </div>
        </template>

        <template v-if="allIntegrations.length > 0">
            <div class="tokens__group" v-for="(item, i) in integrationAssetsByPlatform" :key="i">
                <AssetItemHeader
                    v-if="item.data.length"
                    :logoURI="item.logoURI"
                    :title="item.platform"
                    :value="getAssetsShare(item.totalGroupBalance)"
                    :totalBalance="item.totalGroupBalance"
                    :showRewards="item.totalRewardsBalance > 0"
                    :reward="item.totalRewardsBalance"
                    :healthRate="item.healthRate"
                />
                <div v-for="(groupItem, n) in item.data" :key="n">
                    <AssetItemSubHeader :type="getFormattedName(groupItem.type)" />

                    <AssetItem v-for="(balanceItem, i) in sortByKey(groupItem.balances, 'balanceUsd')" :key="i" :item="balanceItem">
                        <div class="asset-item__info" v-if="balanceItem.balanceType">
                            <div class="asset-item__type">{{ getFormattedName(balanceItem.balanceType) }}</div>
                            <div class="asset-item__unlock" v-if="balanceItem.unlockTimestamp">
                                Unlock {{ getFormattedDate(balanceItem.unlockTimestamp) }}
                            </div>
                            <div class="asset-item__apr" v-if="groupItem.apr"><span>APR </span> {{ prettyNumber(groupItem.apr, 2) }}%</div>
                        </div>
                    </AssetItem>
                </div>
            </div>
        </template>

        <template v-if="isEmpty">
            <EmptyList :title="$t('dashboard.emptyAssets')" />
        </template>

        <template v-if="isLoading">
            <div v-for="(_, ndx) in 3" :key="ndx" class="tokens__group">
                <a-skeleton active avatar :paragraph="{ rows: 0 }" :style="{ paddingTop: '15px' }" />
            </div>
        </template>
    </div>
</template>
<script>
import { computed } from 'vue';
import { useStore } from 'vuex';

import BigNumber from 'bignumber.js';

import useAdapter from '@/Adapter/compositions/useAdapter';

import EmptyList from '@/components/ui/EmptyList';

import AssetItem from './AssetItem';
import AssetItemHeader from './AssetItemHeader';
import AssetItemSubHeader from './AssetItemSubHeader';

import { getTokenIcon, sortByKey } from '@/helpers/utils';
import { prettyNumber } from '@/helpers/prettyNumber';

export default {
    name: 'Tokens',
    components: {
        AssetItemSubHeader,
        AssetItemHeader,
        AssetItem,
        EmptyList,
    },
    setup() {
        const store = useStore();

        const { walletAccount } = useAdapter();

        const BALANCES_TYPES = {
            ALL: 'ALL',
            PENDING: 'PENDING_REWARD',
        };

        const isLoading = computed(() => store.getters['tokens/loader']);

        const allTokens = computed(() => store.getters['tokens/tokens'][walletAccount.value] || []);
        const totalBalance = computed(() => store.getters['tokens/totalBalances'][walletAccount.value] || 0);
        const allIntegrations = computed(() => store.getters['tokens/integrations'][walletAccount.value] || []);

        const isEmpty = computed(() => {
            return !allTokens.value?.length && !allIntegrations.value?.length && !isLoading.value;
        });

        const tokensTotalBalance = computed(() => {
            if (!allTokens.value.length) {
                return 0;
            }

            return allTokens.value.reduce((sum, token) => sum + +token.balanceUsd, 0);
        });

        const integrationAssetsByPlatform = computed(() => {
            const groupByPlatforms = [];

            if (!allIntegrations.value.length) {
                return groupByPlatforms;
            }

            const getTotalBalanceByType = (balances, type = BALANCES_TYPES.ALL) => {
                if (!balances.length) {
                    return 0;
                }

                if (type === BALANCES_TYPES.ALL) {
                    return balances.reduce((sum, token) => sum + +token.balanceUsd, 0);
                }

                return balances.filter(({ balanceType }) => balanceType === type).reduce((sum, token) => sum + +token.balanceUsd, 0);
            };

            const getDataForIntegrations = (integration, balances) => {
                return {
                    platform: integration.platform,
                    data: [integration],
                    logoURI: integration.logo,
                    healthRate: integration?.healthRate,
                    totalGroupBalance: getTotalBalanceByType(balances, BALANCES_TYPES.ALL),
                    totalRewardsBalance: getTotalBalanceByType(balances, BALANCES_TYPES.PENDING),
                };
            };

            for (const integration of allIntegrations.value) {
                const { balances = [] } = integration || {};

                const existingGroup = groupByPlatforms.find(({ platform }) => platform === integration.platform);

                if (existingGroup) {
                    existingGroup.totalGroupBalance += getTotalBalanceByType(balances, BALANCES_TYPES.ALL);
                    existingGroup.totalRewardsBalance += getTotalBalanceByType(balances, BALANCES_TYPES.PENDING);
                    existingGroup.healthRate = integration?.healthRate;
                    existingGroup.data.push(integration);
                    continue;
                }

                groupByPlatforms.push(getDataForIntegrations(integration, balances));
            }

            return groupByPlatforms;
        });

        const getAssetsShare = (balance) => {
            if (!balance || !totalBalance.value) {
                return 0;
            }

            const share = BigNumber(balance).dividedBy(totalBalance.value).multipliedBy(100);

            return share.toFixed(2);
        };

        const getFormattedName = (str) => {
            if (!str) {
                return str;
            }

            return str.charAt(0).toUpperCase() + str.replaceAll('_', ' ').toLowerCase().slice(1);
        };

        const getFormattedDate = (timestamp) => {
            const date = new Date(+timestamp * 1000);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const day = date.getDate();

            return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
        };

        return {
            sortByKey,
            prettyNumber,

            isLoading,

            isEmpty,
            getTokenIcon,

            allTokens,
            allIntegrations,

            tokensTotalBalance,
            integrationAssetsByPlatform,

            getAssetsShare,
            getFormattedName,
            getFormattedDate,
        };
    },
};
</script>
<style lang="scss" scoped>
.tokens {
    display: flex;
    flex-direction: column;
    margin-top: 24px;
    padding-bottom: 24px;
    border-radius: 16px;

    &__group {
        border: 1px solid var(--#{$prefix}border-color);
        background-color: var(--#{$prefix}secondary-background);
        border-radius: 16px;
        padding: 16px;
        margin-bottom: 7px;
        box-sizing: border-box;
        @include animateEasy;

        &.hide {
            height: 74px;
            min-height: 74px;
            overflow: hidden;
        }
    }

    &.empty {
        justify-content: center;
    }
}

.asset-item__info {
    display: flex;
    color: var(--#{$prefix}small-lg-fs);
    font-weight: 500;

    div {
        &::before {
            content: '\2022';
            margin: 0 4px;
        }
    }

    .asset-item__type,
    .asset-item__apr {
        color: var(--#{$prefix}sub-text);
        font-size: var(--#{$prefix}small-lg-fs);
        font-weight: 500;
    }

    .asset-item__apr {
        span {
            font-weight: 400;
            color: var(--#{$prefix}mute-apr-text);
        }
    }

    .asset-item__unlock {
        color: var(--#{$prefix}mute-apr-text);
        font-weight: 400;
        font-size: var(--#{$prefix}small-lg-fs);
    }
}
</style>
