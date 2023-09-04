<template lang="">
    <div v-if="JSON.stringify(chainWithAddress) !== '{}'">
        <div v-for="record in chainList" :key="record" class="chain-item">
            <div class="chain-info">
                <ChainRecord :chain="record" />
                {{ cutAddress(chainWithAddress[record.chain_id]) }}
            </div>
            <div class="chain-actions">
                <a-typography-paragraph :copyable="{ text: chainWithAddress[record.chain_id] }" />
                <a-popover :overlay-inner-style="{ padding: 0 }">
                    <template #content>
                        <a-qrcode error-level="H" :value="chainWithAddress[record.chain_id]" :bordered="false" icon="/zomet-logo.svg" />
                    </template>
                    <QrcodeOutlined />
                </a-popover>
            </div>
        </div>
    </div>
</template>
<script>
import ChainRecord from '@/Adapter/UI/Entities/ChainRecord';
import { cutAddress } from '@/helpers/utils';
import { QrcodeOutlined } from '@ant-design/icons-vue';

export default {
    name: 'ChainWithAddress',
    components: {
        ChainRecord,
        QrcodeOutlined,
    },
    props: {
        chainWithAddress: {
            type: Object,
            required: true,
        },
        chainList: {
            type: Array,
            required: true,
        },
    },
    methods: {
        cutAddress,
    },
};
</script>
<style lang="scss" scoped>
.chain {
    &-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        &:not(:last-child) {
            border-bottom: 1px solid #d0d4f7;
        }
    }

    &-actions {
        display: flex;
        align-items: center;
        gap: 16px;
        & > div {
            margin: 0 !important;
        }
    }
}
</style>
