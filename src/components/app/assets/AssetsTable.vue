<template>
    <a-table :columns="columns" :data-source="data" :pagination="false" :showSorterTooltip="false" class="assets-table">
        <template #headerCell="{ title, column }">
            <p v-if="column.name">
                {{ title }} <span class="name">{{ name }}</span>
            </p>
            <p v-else>{{ title }}</p>
        </template>
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
            required: true,
            default: [],
        },
        type: {
            required: true,
            default: '',
        },
        name: {
            required: false,
        },
    },
    components: {
        AssetItem,
    },
    setup(props) {
        const columns = ref([
            {
                title: props.type,
                dataIndex: 'name',
                key: 'name',
                width: '60%',
                align: 'left',
                name: props.name,
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
        transition: background-color 0.2s ease-in-out !important;
    }

    tr,
    tbody,
    table,
    td {
        background-color: var(--#{$prefix}secondary-background) !important;
    }

    .ant-table-cell {
        height: 48px;
        vertical-align: middle !important;
        padding: 0 !important;
        background-color: var(--#{$prefix}secondary-background) !important;
    }

    .ant-table-tbody > tr:last-child > td {
        border-bottom: none !important;
        padding-bottom: 0 !important;
    }

    .ant-table-tbody tr td,
    .ant-table-tbody tr {
        border: none !important;
    }

    .ant-table-thead .ant-table-cell {
        height: 42px;
        font-weight: 500;
        color: var(--#{$prefix}base-text);
        font-size: var(--#{$prefix}small-sm-fs);
        p {
            padding-top: 8px;
        }
        &::before,
        &::after,
        .ant-table-column-sorter-inner {
            display: none !important;
        }

        .name::before {
            content: '\2022';
            margin: 0 4px;
            color: var(--#{$prefix}checkbox-text);
        }
    }

    .ant-table-thead tr th {
        border-bottom: 1px solid var(--#{$prefix}assets-header-border-color) !important;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
}
</style>
