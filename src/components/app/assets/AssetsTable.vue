<template>
    <a-table
        class="assets-table"
        expand-row-by-click
        :columns="columns"
        :data-source="data"
        :pagination="false"
        :bordered="false"
        :loading="loading"
        :scroll="{ x: 700 }"
        :row-key="rowKey"
        :expanded-row-keys="expandedRowKeys"
        :show-expand-column="data[0]?.nfts && data[0]?.nfts.length > 0 ? true : false"
        :row-expandable="(record) => record?.nfts && record.nfts?.length > 0"
        @expand="onExpand"
    >
        <template #headerCell="{ title, column }">
            <p v-if="column && column.name">
                {{ title }} <span v-if="name" class="name">{{ name }}</span>
            </p>
        </template>

        <template #bodyCell="{ column, record }">
            <AssetItem v-if="record && column" :item="record" :column="column.dataIndex" :type="type" />
        </template>

        <template #expandedRowRender="{ record }">
            <ExpandNftInfo v-if="record" :record="record" />
        </template>
    </a-table>
</template>

<script lang="js">
import { ref, computed } from 'vue';
import AssetItem from '@/components/app/assets/AssetItem.vue';
import ExpandNftInfo from '@/components/app/assets/NFT/ExpandNftInfo.vue';

export default {
    name: 'AssetsTable',
    components: {
        AssetItem,
        ExpandNftInfo,
    },
    props: {
        data: {
            type: Array,
            required: true,
            default: () => [],
        },
        columns: {
            type: Array,
            required: false,
            default: () => [],
        },
        type: {
            type: String,
            required: true,
            default: '',
        },
        name: {
            type: String,
            required: false,
        },
        loading: {
            type: Boolean,
            required: false,
        },
    },
    setup(props) {
        const expandedRowKeys = ref([]);

        const rowKey = (record) =>
            record?.id || `${props.type}-${record?.balanceType}-${record?.name}-${record?.address}-${record?.symbol}`;

        const onExpand = (expanded, record) => {
            if (expanded) expandedRowKeys.value = [rowKey(record)];
            else expandedRowKeys.value = [];
        };

        return {
            expandedRowKeys,
            rowKey,
            onExpand,
        };
    },
};
</script>
