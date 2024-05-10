<template>
    <a-card :tab-list="tabs" size="small" :active-tab-key="activeTabKey" class="nft-item-info" @tab-change="(key) => onTabChange(key)">
        <a-descriptions v-if="activeTabKey === 'collection-info'" bordered size="small" :column="1">
            <a-descriptions-item :label="$t('dashboard.nft.floorPrice')">
                <Amount type="currency" :value="record.floorPrice" :symbol="record.token?.symbol || ''" :decimals="3" />
            </a-descriptions-item>
            <a-descriptions-item :label="$t('dashboard.nft.volume')">
                <Amount type="currency" :value="record.volume || 0" :symbol="record.token?.symbol || ''" :decimals="3" />
            </a-descriptions-item>
            <a-descriptions-item :label="$t('dashboard.nft.marketCap')">
                <Amount type="currency" :value="record.marketCap" :symbol="record.token?.symbol || ''" :decimals="3" />
            </a-descriptions-item>
            <a-descriptions-item :label="$t('dashboard.nft.numberOfItems')">{{ record.numberOfAssets }}</a-descriptions-item>
            <a-descriptions-item :label="$t('dashboard.nft.contractAddress')">{{ record.address }}</a-descriptions-item>
            <a-descriptions-item :label="$t('dashboard.nft.marketplaces')">
                <a-button v-for="(marketplace, i) in record.marketplaces" :key="i" type="link" :href="marketplace.url" target="_blank">
                    <template #icon>
                        <LinkOutlined />
                    </template>
                    {{ marketplace.name }}
                </a-button>
            </a-descriptions-item>
        </a-descriptions>

        <a-descriptions v-if="activeTabKey === 'description'" bordered size="small" :column="1" layout="vertical">
            <a-descriptions-item :label="record.name">
                {{ record.description }}

                <a-empty v-if="!record.description" />
            </a-descriptions-item>
        </a-descriptions>
    </a-card>
</template>
<script>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

import Amount from '../../Amount.vue';

import { LinkOutlined } from '@ant-design/icons-vue';

export default {
    name: 'NFTInfo',
    components: {
        LinkOutlined,
        Amount,
    },
    props: {
        record: {
            required: true,
            type: Object,
            default: () => ({}),
        },
    },
    setup() {
        const { t } = useI18n();
        const tabs = ref([
            {
                key: 'collection-info',
                tab: t('dashboard.nft.collectionInformation'),
            },
            {
                key: 'description',
                tab: t('dashboard.nft.description'),
            },
        ]);

        const activeTabKey = ref('collection-info');

        return {
            tabs,
            activeTabKey,
            onTabChange: (key) => (activeTabKey.value = key),
        };
    },
};
</script>
