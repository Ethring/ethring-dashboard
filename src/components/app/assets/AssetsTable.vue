<template>
    <a-table :columns="columns" :data-source="data" :pagination="false" :showHeader="false" class="assets-table">
        <template #bodyCell="{ column, record }">
            <AssetItem :item="record" :column="column.dataIndex" />
        </template>
    </a-table>
</template>

<script>
import { ref } from 'vue';

import AssetItem from './AssetItem';

export default {
    name: 'AssetsTable',
    props: {
        data: {
            require: true,
            default: [],
        },
    },
    components: {
        AssetItem,
    },
    setup() {
        const columns = ref([
            {
                title: 'Asset',
                dataIndex: 'name',
                key: 'name',
                width: '60%',
                align: 'left',
            },
            {
                title: 'Balance',
                dataIndex: 'balance',
                key: 'balance',
                width: '16%',
                align: 'left',
            },
            {
                title: 'Value',
                dataIndex: 'balanceUsd',
                key: 'balanceUsd',
                width: '16%',
                align: 'right',
                defaultSortOrder: 'descend',
                sorter: (a, b) => a.balanceUsd - b.balanceUsd,
            },
        ]);

        return {
            columns,
        };
    },
};
</script>

<style lang="scss">
.assets-table {
    * {
        transition: background-color 0.24s ease-in-out !important;
    }

    tr,
    td {
        background-color: var(--#{$prefix}secondary-background) !important;
    }

    .ant-table-cell {
        vertical-align: middle !important;
        padding: 12px 0 6px !important;
    }

    .ant-table-tbody > tr:last-child > td {
        border-bottom: none !important;
        padding-bottom: 0 !important;
    }

    .ant-table-tbody tr td {
        border-top-color: var(--#{$prefix}border-color-op-05) !important;
    }
}
</style>
