<template>
    <a-row>
        <a-col :span="24"> </a-col>
        <a-col :span="24">
            <a-table
                class="asset-table"
                expand-row-by-click
                size="small"
                :columns="columns"
                :data-source="data"
                :pagination="false"
                :bordered="false"
                :loading="loading"
                :scroll="{ x: 700 }"
                :row-key="(record) => rowKey(record)"
            >
                <template #bodyCell="{ column, record }">
                    <AssetRow v-if="record && column" :item="record" :column="column.dataIndex" />
                </template>
            </a-table>
        </a-col>
    </a-row>
</template>
<script>
import AssetRow from '@/components/ui/AssetTable/AssetRow';

import { onMounted } from 'vue';

export default {
    name: 'AssetsTable',
    components: {
        AssetRow,
    },
    props: {
        columns: {
            type: Array,
            default: () => [],
        },
        data: {
            type: Array,
            default: () => [],
        },
        loading: {
            type: Boolean,
            default: false,
        },
        name: {
            type: String,
            default: '',
        },
        type: {
            type: String,
            default: 'asset',
        },
    },

    setup(props) {
        const rowKey = (record) =>
            record?.id || `${props.type}-${record?.balanceType}-${record?.name}-${record?.address}-${record?.symbol}`;

        onMounted(() => {
            console.log('mounted');
        });
        return {
            rowKey,
        };
    },
};
</script>
<style lang=""></style>
