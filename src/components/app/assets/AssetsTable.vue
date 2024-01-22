<template>
    <a-table
        class="assets-table"
        expandRowByClick
        :columns="columns"
        :data-source="data"
        :pagination="false"
        :bordered="false"
        :loading="loading"
        :scroll="{ x: 700 }"
        :rowKey="(record) => record?.id || `${record?.balanceType}-${record?.name}-${record?.address}`"
        :rowExpandable="(record) => record.nfts && record.nfts.length > 0"
        :showExpandColumn="data[0]?.nfts && data[0]?.nfts.length > 0 ? true : false"
    >
        <template #headerCell="{ title, column }">
            <p v-if="column && column.name">
                {{ title }} <span class="name" v-if="name">{{ name }}</span>
            </p>
        </template>

        <template #bodyCell="{ column, record }">
            <AssetItem :item="record" :column="column.dataIndex" :type="record.nfts ? 'nft' : 'asset'" />
        </template>

        <template #expandedRowRender="{ record }">
            <ExpandNftInfo :record="record" />
        </template>
    </a-table>
</template>

<script>
import AssetItem from './AssetItem';
import ExpandNftInfo from './NFT/ExpandNftInfo.vue';

export default {
    name: 'AssetsTable',
    props: {
        data: {
            required: true,
            default: [],
        },
        columns: {
            required: false,
            default: [],
        },
        type: {
            required: true,
            default: '',
        },
        name: {
            required: false,
        },
        loading: {
            required: false,
            default: false,
        },
    },
    components: {
        AssetItem,
        ExpandNftInfo,
    },
};
</script>
