<template>
    <div class="tokens" :class="{ empty: isEmpty }">
        <template v-if="allTokensSorted.length > 0">
            <div class="tokens__group">
                <AssetItemHeader
                    v-if="allTokensSorted.length"
                    title="Tokens"
                    :value="getAssetsShare(assetsTotalBalances)"
                    :totalBalance="assetsTotalBalances"
                />
                <AssetItemSubHeader type="Asset" />

                <AssetItem v-for="(listItem, n) in allTokensSorted" :key="n" :item="listItem" />
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

                    <AssetItem v-for="(balanceItem, i) in groupItem.balances" :key="i" :item="balanceItem">
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

        <template v-if="isAllTokensLoading">
            <div v-for="(_, ndx) in 3" :key="ndx" class="tokens__group">
                <a-skeleton active avatar :paragraph="{ rows: 0 }" :style="{ paddingTop: '15px' }" />
            </div>
        </template>
    </div>
</template>
<script>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';

import BigNumber from 'bignumber.js';

import useAdapter from '@/Adapter/compositions/useAdapter';

import EmptyList from '@/components/ui/EmptyList';

import AssetItem from './AssetItem';
import AssetItemHeader from './AssetItemHeader';
import AssetItemSubHeader from './AssetItemSubHeader';

import { getTokenIcon, sortByKey } from '@/helpers/utils';
import { prettyNumber } from '@/helpers/prettyNumber';

import { getIntegrationsGroupedByPlatform, getFormattedName, getFormattedDate } from '@/shared/utils/assets';

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

        const { walletAccount, currentChainInfo } = useAdapter();

        const isLoadingForChain = computed(() => store.getters['tokens/loadingByChain'](currentChainInfo.value?.net));
        const isAllTokensLoading = computed(() => store.getters['tokens/loader']);

        const allTokens = computed(() => store.getters['tokens/tokens'][walletAccount.value] || []);
        const allIntegrations = computed(() => store.getters['tokens/integrations'][walletAccount.value] || []);

        const totalBalances = computed(() => store.getters['tokens/totalBalances'][walletAccount.value] || 0);
        const assetsTotalBalances = computed(() => store.getters['tokens/assetsBalances'][walletAccount.value] || 0);

        const allTokensSorted = computed(() => sortByKey(allTokens.value, 'balanceUsd'));

        const isEmpty = computed(() => {
            return !allTokens.value?.length && !allIntegrations.value?.length && !isLoadingForChain.value && !isAllTokensLoading.value;
        });

        const integrationAssetsByPlatform = ref(getIntegrationsGroupedByPlatform(allIntegrations.value));

        const getAssetsShare = (balance) => {
            if (!balance || !totalBalances.value) {
                return 0;
            }

            const share = BigNumber(balance).dividedBy(totalBalances.value).multipliedBy(100);

            return share.toNumber();
        };

        watch(isAllTokensLoading, () => {
            if (!isAllTokensLoading.value) {
                integrationAssetsByPlatform.value = getIntegrationsGroupedByPlatform(allIntegrations.value);
            }
        });

        watch(walletAccount, () => {
            integrationAssetsByPlatform.value = getIntegrationsGroupedByPlatform(allIntegrations.value);
        });

        watch(isLoadingForChain, () => {
            if (!isLoadingForChain.value) {
                integrationAssetsByPlatform.value = getIntegrationsGroupedByPlatform(allIntegrations.value);
            }
        });

        return {
            prettyNumber,

            isLoadingForChain,
            isAllTokensLoading,

            isEmpty,
            getTokenIcon,

            allTokensSorted,
            allIntegrations,

            assetsTotalBalances,
            integrationAssetsByPlatform,

            // utils for Assets templates
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
        margin-bottom: 32px;
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
    font-size: var(--#{$prefix}small-lg-fs);

    div {
        &::before {
            content: '\2022';
            margin: 0 4px;
            color: var(--#{$prefix}checkbox-text);
        }
    }

    .asset-item__type,
    .asset-item__apr {
        color: var(--#{$prefix}sub-text);
        font-size: var(--#{$prefix}small-lg-fs);
        font-weight: 300;
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
