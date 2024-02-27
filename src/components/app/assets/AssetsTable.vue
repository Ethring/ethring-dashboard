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
        :rowKey="(record) => record?.id || `${type}-${record?.balanceType}-${record?.name}-${record?.address}-${record?.symbol}`"
        :rowExpandable="(record) => record.nfts && record.nfts.length > 0"
        :showExpandColumn="data[0]?.nfts && data[0]?.nfts.length > 0 ? true : false"
    >
        <template #headerCell="{ title, column }">
            <p v-if="column && column.name">
                {{ title }} <span class="name" v-if="name">{{ name }}</span>
            </p>
        </template>

        <template #bodyCell="{ column, record }">
            <AssetItem :item="record" :column="column.dataIndex" :type="type" />
        </template>

        <template #expandedRowRender="{ record }">
            <ExpandNftInfo :record="record" />
        </template>
        <!--
        <template #footer v-if="isLoadMore">
            <div class="assets-table__footer">
                <Button @click="handleLoadMore" type="text" class="assets-table__footer-btn" title="Show All" />
            </div>
        </template>
        -->
    </a-table>
</template>

<script>
import { computed, ref, watch } from 'vue';
import _ from 'lodash';

import AssetItem from '@/components/app/assets/AssetItem.vue';
import ExpandNftInfo from '@/components/app/assets/NFT/ExpandNftInfo.vue';
import Button from '@/components/ui/Button.vue';

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
