<template>
    <div class="tokens" :class="{ empty: emptyLists }">
        <template v-if="allTokens.length > 1">
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
        <template v-if="allTokens.length > 1">
            <div class="tokens__group" v-for="(item, i) in integrationAssetsByPlatform" :key="i">
                <AssetItemHeader
                    v-if="item.data.length"
                    :logoURI="item.logoURI"
                    :title="item.platform"
                    :value="getAssetsShare(item.totalGroupBalance)"
                    :totalBalance="item.totalGroupBalance"
                    :showRewards="item.totalRewardsBalance > 0"
                    :reward="item.totalRewardsBalance"
                />
                <div v-for="(groupItem, n) in item.data" :key="n">
                    <AssetItemSubHeader :type="getFormattedName(groupItem.integration.type)" />

                    <AssetItem v-for="(balanceItem, i) in sortByKey(groupItem.balances, 'balanceUsd')" :key="i" :item="balanceItem">
                        <div class="asset-item__info" v-if="balanceItem.balance_type">
                            <div class="asset-item__type">{{ getFormattedName(balanceItem.balance_type) }}</div>
                            <div class="asset-item__unlock" v-if="balanceItem.unlock_timestamp">
                                Unlock {{ getFormattedDate(balanceItem.unlock_timestamp) }}
                            </div>
                        </div>
                    </AssetItem>
                </div>
            </div>
        </template>

        <template v-if="loader">
            <div v-for="(_, ndx) in 5" :key="ndx" class="tokens__group" @click="toggleGroup(ndx)">
                <a-skeleton active avatar :paragraph="{ rows: 0 }" :style="{ paddingTop: '15px' }" />
            </div>
        </template>

        <template v-if="!loader && !allTokens.length">
            <EmptyList title="You don't have any assets" />
        </template>
    </div>
</template>
<script>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';

import EmptyList from '@/components/ui/EmptyList';
import AssetItem from './AssetItem';
import AssetItemHeader from './AssetItemHeader';
import AssetItemSubHeader from './AssetItemSubHeader.vue';

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

        const groupHides = ref({});

        const loader = computed(() => store.getters['tokens/loader']);

        const allTokens = computed(() => store.getters['tokens/tokens']);

        const totalBalance = computed(() => store.getters['tokens/totalBalance']);

        const allIntegrations = computed(() => store.getters['tokens/integrations']);

        const emptyLists = computed(() => {
            return !allTokens.value.length && !allIntegrations.value.length;
        });

        const tokensTotalBalance = computed(() => {
            if (!allTokens.value.length) {
                return 0;
            }

            return allTokens.value.reduce((sum, token) => sum + +token.balanceUsd, 0);
        });

        const integrationAssetsByPlatform = computed(() => {
            const separatedArray = [];

            if (allIntegrations.value.length) {
                allIntegrations.value?.forEach((obj) => {
                    const existingGroup = separatedArray?.find((group) => group?.platform === obj.integration.platform);

                    if (existingGroup) {
                        existingGroup.totalGroupBalance += obj.balances?.reduce((sum, token) => sum + +token.balanceUsd, 0);
                        existingGroup.totalRewardsBalance += obj.balances
                            ?.filter((elem) => elem.balance_type === 'PENDING_REWARD')
                            ?.reduce((sum, token) => sum + +token.balanceUsd, 0);

                        existingGroup.data.push(obj);
                    } else {
                        const totalGroupBalance = obj.balances?.reduce((sum, token) => sum + +token.balanceUsd, 0);
                        const totalRewardsBalance = obj.balances
                            .filter((elem) => elem.balance_type === 'PENDING_REWARD')
                            ?.reduce((sum, token) => sum + +token.balanceUsd, 0);

                        separatedArray.push({
                            platform: obj.integration.platform,
                            data: [obj],
                            logoURI: obj.integration.logo,
                            totalGroupBalance,
                            totalRewardsBalance,
                        });
                    }
                });
            }

            return separatedArray;
        });

        const getAssetsShare = (balance) => {
            const share = (balance / totalBalance.value) * 100;

            if (share < 1) {
                return share.toFixed(2);
            }

            return Math.round(share);
        };

        const toggleGroup = (groupNdx) => {
            groupHides.value[groupNdx] = !groupHides.value[groupNdx];
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
            groupHides,
            getTokenIcon,
            prettyNumber,
            loader,
            emptyLists,
            allTokens,
            allIntegrations,
            tokensTotalBalance,
            integrationAssetsByPlatform,

            getAssetsShare,
            toggleGroup,
            sortByKey,
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

    &__group {
        border: 1px solid $colorLightGreen;
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

    &__group:hover {
        box-shadow: 0px 4px 40px rgba(0, 0, 0, 0.2);
    }
}

.asset-item__info {
    display: flex;
    font-size: 14px;
    font-family: 'Poppins_Medium';

    div {
        &::before {
            content: '\2022';
            margin: 0 4px;
        }
    }

    .asset-item__type {
        color: #0d7e71;
    }

    .asset-item__unlock {
        color: #6d747a;
        font-family: 'Poppins_Regular';
    }
}
</style>
