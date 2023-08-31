<template>
    <div class="tokens" :class="{ empty: emptyLists }">
        <template v-if="groupTokens.length > 1">
            <div class="tokens__group">
                <AssetItemHeader
                    v-if="groupTokens.length"
                    title="Tokens"
                    value="40"
                    :showRewards="true"
                    reward="65.05"
                    totalBalance="12 510"
                />
                <AssetItemSubHeader type="Asset" />
                <div v-for="(group, ndx) in groupTokens.filter((g) => g.list.length)" :key="ndx">
                    <AssetItem v-for="(listItem, n) in group.list" :key="n" :item="listItem">
                        <!-- <div class="asset-item__info">
                            <div class="asset-item__type">Deposit</div>
                            <div class="asset-item__unlock">Unlock 27/05/2026</div>
                        </div> -->
                    </AssetItem>
                </div>
            </div>
        </template>

        <template v-if="loader">
            <div v-for="(_, ndx) in 5" :key="ndx" class="tokens__group" @click="toggleGroup(ndx)">
                <a-skeleton active avatar :paragraph="{ rows: 0 }" :style="{ paddingTop: '15px' }" />
            </div>
        </template>

        <template v-if="!loader && !groupTokens.length">
            <EmptyList title="You don't have any assets" />
        </template>
    </div>
</template>
<script>
import { computed, ref, watch } from 'vue';
import { useStore } from 'vuex';

import useTokens from '@/compositions/useTokens';
import EmptyList from '@/components/ui/EmptyList';
import AssetItem from './AssetItem';
import AssetItemHeader from './AssetItemHeader';
import AssetItemSubHeader from './AssetItemSubHeader.vue';

import { getTokenIcon } from '@/helpers/utils';
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
        const { tokens, groupTokens } = useTokens();
        const groupHides = ref({});

        const loader = computed(() => store.getters['tokens/loader']);
        const zometNetworks = computed(() => store.getters['networks/zometNetworksList']);

        const emptyLists = computed(() => {
            return !tokens.value.length && groupTokens.value.every((g) => !g.list.length); // <=1 - parent network
        });

        watch(groupTokens, () => {
            if (groupTokens.value) {
                groupTokens.value.map((chain) => {
                    const matchingNetwork = zometNetworks.value.find((network) => network.net === chain.net);
                    if (matchingNetwork) {
                        chain.list.forEach((token) => {
                            token.chainLogo = matchingNetwork.logo;
                        });
                    }
                });
            }
        });

        const toggleGroup = (groupNdx) => {
            groupHides.value[groupNdx] = !groupHides.value[groupNdx];
        };

        return {
            groupHides,
            tokens,
            groupTokens,
            getTokenIcon,
            prettyNumber,
            loader,
            emptyLists,
            toggleGroup,
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
